from django.db import models
from malls.models import Mall
from products.models import Product
from decimal import Decimal

class Order(models.Model):
    STATUS = (
        ('PAYMENT_PENDING', 'Payment Pending'),
        ('PAID', 'Paid'),
        ('FULFILLED', 'Fulfilled'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    )

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name='orders')
    mall = models.ForeignKey(Mall, on_delete=models.SET_NULL, null=True, related_name='orders')
    order_number = models.CharField(max_length=32, unique=True)
    
    status = models.CharField(max_length=20, choices=STATUS, default='PAYMENT_PENDING')
    
    cgst = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    sgst = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    igst = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    cart_hash = models.CharField(max_length=64, blank=True, db_index=True)

    expires_at = models.DateTimeField(null=True, blank=True)

    is_exited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["user", "mall", "status"]),
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
    
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    taxable_value = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    cgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    sgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    
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