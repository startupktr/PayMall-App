from django.db import models
from django.conf import settings
from malls.models import Mall
from products.models import Product
from django.utils import timezone
from datetime import timedelta

User = settings.AUTH_USER_MODEL

def get_payment_expiry():
    return timezone.now() + timedelta(minutes=15)

class Order(models.Model):
    ORDER_STATUS = (
        ('CREATED', 'Created'),              # order exists
        ('PAYMENT_PENDING', 'Payment Pending'),
        ('PAID', 'Paid'),
        ('FULFILLED', 'Fulfilled'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    )
    
    PAYMENT_STATUS = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )
    
    PAYMENT_METHOD = (
        ('CREDIT', 'Credit/Debit Card'),
        ('UPI', 'UPI Payment'),
        ('CASH', 'Cash Payment'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    mall = models.ForeignKey(Mall, on_delete=models.SET_NULL, null=True, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True)
    
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='CREATED')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD, null=True, blank=True)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    payment_gateway_order_id = models.CharField(
        max_length=100, null=True, blank=True
    )
    payment_reference = models.CharField(
        max_length=100, null=True, blank=True
    )
    
    payment_expires_at = models.DateTimeField(default=get_payment_expiry)
    is_paid = models.BooleanField(default=False)
    is_exited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["order_number"]),
        ]

    def __str__(self):
        return f"Order #{self.order_number} - {self.user.email}"


class OrderItem(models.Model):
    """Model to store items in an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    
    # Store product details at time of purchase (in case product changes later)
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    product_barcode = models.CharField(max_length=50)
    
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.product_name} ({self.quantity}) - Order #{self.order.order_number}"


class ExitOTP(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["order"], name="unique_exit_otp_per_order")
        ]