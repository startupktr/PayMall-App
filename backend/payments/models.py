from django.db import models
from orders.models import Order
from decimal import Decimal

class PaymentMethod(models.Model):
    """Model to store various payment methods for users"""
    PAYMENT_TYPES = (
        ('CREDIT', 'Credit/Debit Card'),
        ('UPI', 'UPI Payment'),
        ('CASH', 'Cash Payment'),
    )
    
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name='payment_methods')
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPES)
    
    # For credit cards (masked for security)
    card_number_last_four = models.CharField(max_length=4, blank=True, null=True)
    card_expiry = models.CharField(max_length=7, blank=True, null=True)  # Format: MM/YYYY
    
    # For UPI
    upi_id = models.CharField(max_length=50, blank=True, null=True)
    
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_payment_type_display()} - {self.user.email}"

class PaymentAttempt(models.Model):
    PROVIDER = (
        ("UPI", "UPI"),
        ("CARD", "Card"),
        ("CASH", "Cash"),
        ("RAZORPAY", "Razorpay"),
        ("PHONEPE", "PhonePe"),
    )

    STATUS = (
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payment_attempts")

    provider = models.CharField(max_length=20, choices=PROVIDER, default="MOCK")
    status = models.CharField(max_length=20, choices=STATUS, default="PENDING")

    attempt_no = models.PositiveIntegerField(default=1)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    provider_order_id = models.CharField(max_length=100, blank=True, null=True)
    provider_payment_id = models.CharField(max_length=100, blank=True, null=True)

    failure_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["provider", "status"]),
        ]

    def __str__(self):
        return f"{self.provider} attempt #{self.attempt_no} for {self.order.order_number}"


class Payment(models.Model):
    STATUS = (
        ("PAID", "Paid"),
        ("REFUNDED", "Refunded"),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    attempt = models.OneToOneField(PaymentAttempt, on_delete=models.PROTECT, related_name="final_payment")

    provider = models.CharField(max_length=50)  # razorpay / phonepe
    gateway_payment_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS, default="PENDING")
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["provider"])]

    def __str__(self):
        return f"Payment #{self.id} {self.order.order_number}"