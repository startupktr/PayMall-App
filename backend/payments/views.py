from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from payments.models import Payment
from orders.models import Order
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, permissions
import random
from django.db import transaction
from django.db.models import F
from products.models import Product
from orders.models import ExitOTP
from .models import PaymentMethod, PaymentAttempt
from cart.models import Cart, CartItem
from .serializers import PaymentMethodSerializer
from common.responses import success_response, error_response
from products.services import check_inventory_alert
from decimal import Decimal
from orders.utils import is_expired


class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get("order_id")
        provider = request.data.get("provider")

        if not order_id or not provider:
            return error_response(
                message="order_id and provider are required",
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = get_object_or_404(
            Order,
            id=order_id,
            user=request.user,
        )

        # ✅ already paid
        if order.status == "PAID":
            return error_response(
                message="Order already paid",
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ only pending orders can be paid
        if order.status != "PAYMENT_PENDING":
            return error_response(
                message=f"Order is not payable (status: {order.status})",
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ If there is already a PENDING payment attempt, reuse it (avoid spam)
        pending = (
            Payment.objects.select_for_update()
            .filter(order=order, status="PENDING")
            .order_by("-created_at")
            .first()
        )

        if pending:
            return success_response(
                message="Payment already initiated",
                data={
                    "payment_id": pending.id,
                    "amount": str(pending.amount),
                    "provider": pending.provider,
                },
                status=status.HTTP_200_OK,
            )

        # ✅ Create a new attempt (retry)
        payment = Payment.objects.create(
            order=order,
            provider=provider,
            amount=order.total,
            status="PENDING",
            gateway_payment_id=None,
        )

        return success_response(
            message="Payment initiated",
            data={
                "payment_id": payment.id,
                "amount": str(payment.amount),
                "provider": payment.provider,
            },
            status=status.HTTP_200_OK,
        )

class PaymentSuccessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        payment_id = request.data.get("payment_id")
        gateway_payment_id = request.data.get("gateway_payment_id")

        if not payment_id or not gateway_payment_id:
            return error_response(
                message="payment_id and gateway_payment_id are required",
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = get_object_or_404(
            Payment.objects.select_for_update().select_related("order"),
            id=payment_id,
        )

        order = payment.order

        # ✅ Ensure user owns this order/payment
        if order.user != request.user:
            return error_response(
                message="Unauthorized payment access",
                status=status.HTTP_403_FORBIDDEN,
            )

        # ✅ If order already paid -> safe return (prevents double stock deduction)
        if order.status == "PAID" and order.payment_status == "PAID":
            otp_obj = ExitOTP.objects.filter(order=order).first()
            return success_response(
                message="Payment already processed",
                data={
                    "order_id": order.id,
                    "exit_otp": otp_obj.otp if otp_obj else None,
                },
                status=status.HTTP_200_OK,
            )

        # ✅ If payment already marked success, finalize order anyway
        if payment.status == "SUCCESS":
            order.status = "PAID"
            order.payment_status = "PAID"
            order.is_paid = True
            order.payment_reference = payment.gateway_payment_id
            order.save(update_fields=["status", "payment_status", "is_paid", "payment_reference"])
        else:
            # ✅ Only pending payments can be completed
            if payment.status != "PENDING":
                return error_response(
                    message=f"Payment is not pending (status: {payment.status})",
                    status=status.HTTP_409_CONFLICT,
                )

            # ✅ Deduct stock safely once
            for item in order.items.select_related("product").all():
                product = Product.objects.select_for_update().get(id=item.product.id)

                if product.stock_quantity < item.quantity:
                    payment.status = "FAILED"
                    payment.save(update_fields=["status"])

                    return error_response(
                        message=f"Stock not available for {product.name}",
                        status=status.HTTP_409_CONFLICT,
                    )

                product.stock_quantity = F("stock_quantity") - item.quantity
                product.save(update_fields=["stock_quantity"])

            # ✅ Mark payment success
            payment.status = "SUCCESS"
            payment.gateway_payment_id = gateway_payment_id
            payment.save(update_fields=["status", "gateway_payment_id"])

            # ✅ Mark order success
            order.status = "PAID"
            order.payment_status = "PAID"
            order.is_paid = True
            order.payment_reference = gateway_payment_id
            order.save(update_fields=["status", "payment_status", "is_paid", "payment_reference"])

        # ✅ Clear ACTIVE cart after payment success (POS correct)
        cart = Cart.objects.filter(
            user=order.user,
            mall=order.mall,
            status="ACTIVE",
        ).prefetch_related("items").first()

        if cart:
            cart.items.all().delete()

        # ✅ Create exit OTP
        otp_obj, _ = ExitOTP.objects.get_or_create(
            order=order,
            defaults={
                "otp": str(random.randint(100000, 999999)),
                "expires_at": timezone.now() + timedelta(minutes=5),
            },
        )

        return success_response(
            message="Payment successful",
            data={
                "order_id": order.id,
                "exit_otp": otp_obj.otp,
            },
            status=status.HTTP_200_OK,
        )

class PaymentFailedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        payment_id = request.data.get("payment_id")

        if not payment_id:
            return error_response(message="payment_id is required", status=400)

        payment = get_object_or_404(
            Payment.objects.select_for_update().select_related("order"),
            id=payment_id,
        )

        if payment.order.user != request.user:
            return error_response(message="Unauthorized", status=403)

        if payment.status == "SUCCESS":
            return error_response(message="Payment already success", status=400)

        payment.status = "FAILED"
        payment.save(update_fields=["status"])

        return success_response(
            message="Payment marked as failed",
            data={"payment_id": payment.id},
            status=200,
        )


class PaymentMethodListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentMethodSerializer

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(
            message="Payment methods fetched",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        if serializer.validated_data.get("is_default"):
            PaymentMethod.objects.filter(
                user=request.user,
                payment_type=serializer.validated_data["payment_type"],
            ).update(is_default=False)

        serializer.save(user=request.user)

        return success_response(
            message="Payment method added",
            data=serializer.data,
            status=status.HTTP_201_CREATED,
        )


class PaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentMethodSerializer

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=True
        )

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        if serializer.validated_data.get("is_default"):
            PaymentMethod.objects.filter(
                user=request.user,
                payment_type=serializer.validated_data["payment_type"],
            ).exclude(id=self.get_object().id).update(is_default=False)

        serializer.save()

        return success_response(
            message="Payment method updated",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()

        return success_response(
            message="Payment method deleted",
            status=status.HTTP_200_OK,
        )


class CreatePaymentAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get("order_id")
        provider = request.data.get("provider", "MOCK")

        if not order_id:
            return error_response("order_id is required", status=status.HTTP_400_BAD_REQUEST)

        order = (
            Order.objects.select_for_update()
            .filter(id=order_id, user=request.user)
            .first()
        )

        if not order:
            return error_response("Order not found", status=status.HTTP_404_NOT_FOUND)

        # ✅ Lazy expire (no job needed)
        if order.status == "PAYMENT_PENDING" and order.expires_at and order.expires_at <= timezone.now():
            order.status = "EXPIRED"
            order.save(update_fields=["status"])
            return error_response("Order expired", status=status.HTTP_400_BAD_REQUEST)

        if order.status != "PAYMENT_PENDING":
            return error_response("Order is not payable now", status=status.HTTP_400_BAD_REQUEST)

        # ✅ If there is an existing PENDING attempt, return it (optional, prevents spam)
        existing_attempt = (
            PaymentAttempt.objects.filter(order=order, status="PENDING")
            .order_by("-attempt_no")
            .first()
        )
        if existing_attempt:
            return success_response(
                message="Payment attempt already exists",
                data={
                    "attempt_id": existing_attempt.id,
                    "order_id": order.id,
                    "amount": str(existing_attempt.amount),
                    "provider": existing_attempt.provider,
                    "provider_order_id": existing_attempt.provider_order_id,
                    "status": existing_attempt.status,
                },
                status=status.HTTP_200_OK,
            )

        last_attempt = PaymentAttempt.objects.filter(order=order).order_by("-attempt_no").first()
        attempt_no = 1 if not last_attempt else last_attempt.attempt_no + 1

        attempt = PaymentAttempt.objects.create(
            order=order,
            provider=provider,
            status="CREATED",
            attempt_no=attempt_no,
            amount=Decimal(order.total),
        )

        # ✅ Create provider order at gateway here
        # Example: attempt.provider_order_id = razorpay_client.order.create(...)
        # For now: mock
        attempt.provider_order_id = f"MOCK_{order.order_number}_{attempt_no}"
        attempt.status = "PENDING"
        attempt.save(update_fields=["provider_order_id", "status"])

        return success_response(
            message="Payment attempt created",
            data={
                "attempt_id": attempt.id,
                "order_id": order.id,
                "amount": str(attempt.amount),
                "provider": attempt.provider,
                "provider_order_id": attempt.provider_order_id,
                "status": attempt.status,
            },
            status=status.HTTP_201_CREATED,
        )

class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        attempt_id = request.data.get("attempt_id")
        success = request.data.get("success", False)
        provider_payment_id = request.data.get("provider_payment_id")
        error_message = request.data.get("error_message", "Payment failed")

        if not attempt_id:
            return error_response("attempt_id is required", status=status.HTTP_400_BAD_REQUEST)

        attempt = (
            PaymentAttempt.objects.select_for_update()
            .select_related("order")
            .filter(id=attempt_id, order__user=request.user)
            .first()
        )

        if not attempt:
            return error_response("Payment attempt not found", status=status.HTTP_404_NOT_FOUND)

        order = attempt.order

        # ✅ Lazy expire
        if order.status == "PAYMENT_PENDING" and order.expires_at and order.expires_at <= timezone.now():
            order.status = "EXPIRED"
            order.save(update_fields=["status"])

            attempt.status = "EXPIRED"
            attempt.save(update_fields=["status"])

            return error_response("Order expired", status=status.HTTP_400_BAD_REQUEST)

        if order.status != "PAYMENT_PENDING":
            return error_response("Order is not payable now", status=status.HTTP_400_BAD_REQUEST)

        if attempt.status == "SUCCESS":
            # ✅ already paid
            return success_response(
                message="Already verified",
                data={"order_id": order.id, "status": order.status},
                status=status.HTTP_200_OK,
            )

        if success:
            attempt.status = "SUCCESS"
            attempt.provider_payment_id = provider_payment_id
            attempt.save(update_fields=["status", "provider_payment_id"])

            order.status = "PAID"
            order.save(update_fields=["status"])

            # ✅ Clear cart items only on successful payment
            CartItem.objects.filter(
                cart__user=request.user,
                cart__mall=order.mall,
                cart__status="ACTIVE"
            ).delete()

            return success_response(
                message="Payment successful",
                data={"order_id": order.id, "status": order.status},
                status=status.HTTP_200_OK,
            )

        # ✅ failure (keep order PAYMENT_PENDING so user can retry within expiry)
        attempt.status = "FAILED"
        attempt.error_message = error_message
        attempt.save(update_fields=["status", "error_message"])

        return success_response(
            message="Payment failed (you can retry)",
            data={"order_id": order.id, "status": order.status},
            status=status.HTTP_200_OK,
        )