from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
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
from .models import Payment
from products.models import Product
from cart.models import Cart
from orders.models import ExitOTP
from .models import PaymentMethod
from .serializers import PaymentMethodSerializer

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction

from orders.models import Order
from payments.models import Payment


class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get("order_id")
        provider = request.data.get("provider")

        if not order_id or not provider:
            return Response(
                {"error": "order_id and provider are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = get_object_or_404(
            Order,
            id=order_id,
            user=request.user,
            status="PAYMENT_PENDING"
        )

        # 🔒 One order → one payment (REUSE)
        payment, created = Payment.objects.select_for_update().get_or_create(
            order=order,
            defaults={
                "provider": provider,
                "amount": order.total,
                "status": "PENDING",
            }
        )

        # 🔁 RETRY CASE (payment already exists)
        if not created:
            if payment.status == "SUCCESS":
                return Response(
                    {"error": "Order already paid"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Reset for retry
            payment.provider = provider
            payment.status = "PENDING"
            payment.payment_id = None
            payment.save()

        return Response(
            {
                "payment_id": payment.id,
                "amount": payment.amount,
                "retry": not created,
            },
            status=status.HTTP_200_OK
        )


class PaymentSuccessView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        payment_id = request.data.get("payment_id")
        gateway_payment_id = request.data.get("gateway_payment_id")

        payment = get_object_or_404(Payment, id=payment_id)
        order = payment.order

        if payment.status == "SUCCESS":
            return Response({"message": "Already processed"})

        payment.status = "SUCCESS"
        payment.payment_id = gateway_payment_id
        payment.save()

        order.status = "PAID"
        order.payment_status = "PAID"
        order.is_paid = True
        order.save()

        # 🔥 Deduct stock
        for item in order.items.select_related("product"):
            product = Product.objects.select_for_update().get(id=item.product.id)

            if product.stock_quantity < item.quantity:
                raise Exception("Stock inconsistency")

            product.stock_quantity = F("stock_quantity") - item.quantity
            product.save()

        ExitOTP.objects.get_or_create(
            order=order,
            defaults={
                "otp": str(random.randint(100000, 999999)),
                "expires_at": timezone.now() + timedelta(minutes=5)
            }
        )

        Cart.objects.filter(user=order.user).delete()

        return Response({"message": "Payment successful"})

class PaymentMethodListView(generics.ListCreateAPIView):
    """
    LIST & CREATE payment methods
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if serializer.validated_data.get("is_default", False):
            PaymentMethod.objects.filter(
                user=self.request.user,
                payment_type=serializer.validated_data.get("payment_type")
            ).update(is_default=False)

        serializer.save(user=self.request.user)


class PaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    RETRIEVE / UPDATE / DELETE payment method
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get("is_default", False):
            PaymentMethod.objects.filter(
                user=self.request.user,
                payment_type=serializer.validated_data.get("payment_type")
            ).exclude(id=self.get_object().id).update(is_default=False)

        serializer.save()
