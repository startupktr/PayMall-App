from django.db import models
from orders.models import Order
from accounts.models import User

class PaymentMethod(models.Model):
    """Model to store various payment methods for users"""
    PAYMENT_TYPES = (
        ('CREDIT', 'Credit/Debit Card'),
        ('UPI', 'UPI Payment'),
        ('CASH', 'Cash Payment'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user')
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


class Payment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    provider = models.CharField(max_length=50)  # razorpay / phonepe
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.CASCADE, related_name='payment_methods', null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING", "PENDING"),
            ("SUCCESS", "SUCCESS"),
            ("FAILED", "FAILED"),
        ],
        default="PENDING"
    )
    created_at = models.DateTimeField(auto_now_add=True)
