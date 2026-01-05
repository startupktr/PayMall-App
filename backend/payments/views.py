from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from payments.models import Payment
from orders.models import Order
from django.utils import timezone
from datetime import timedelta
import random

from .models import Payment
from cart.models import Cart
from orders.models import ExitOTP

class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        provider = request.data.get("provider")

        try:
            order = Order.objects.get(
                id=order_id,
                user=request.user,
                is_paid=False
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "Invalid order"},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = Payment.objects.create(
            order=order,
            provider=provider,
            amount=order.total_amount
        )

        # 🔥 Later integrate Razorpay here
        return Response({
            "payment_id": payment.id,
            "amount": payment.amount
        })

class PaymentSuccessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get("payment_id")
        gateway_payment_id = request.data.get("gateway_payment_id")

        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return Response({"error": "Invalid payment"}, status=400)

        order = payment.order

        if order.is_paid:
            return Response({"message": "Already processed"})

        # 1️⃣ Mark payment success
        payment.status = "SUCCESS"
        payment.payment_id = gateway_payment_id
        payment.save()

        # 2️⃣ Mark order paid
        order.is_paid = True
        order.save()

        # 3️⃣ Reduce stock
        for item in order.items.all():
            product = item.product
            product.stock -= item.quantity
            product.save()

        # 4️⃣ Generate EXIT OTP
        otp = str(random.randint(100000, 999999))
        ExitOTP.objects.create(
            order=order,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        # 5️⃣ Clear cart
        Cart.objects.filter(user=order.user).delete()

        return Response({
            "message": "Payment successful",
            "exit_otp": otp
        })