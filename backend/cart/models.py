from django.db import models
from django.conf import settings
from products.models import Product
from malls.models import Mall
from decimal import Decimal

User = settings.AUTH_USER_MODEL

class Cart(models.Model):
    CART_STATUS = (
        ("ACTIVE", "Active"),
        ("CONVERTED", "Converted to Order"),
        ("ABANDONED", "Abandoned"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    mall = models.ForeignKey(Mall, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=CART_STATUS,
        default="ACTIVE"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ("user", "mall", "status")
    
    @property
    def total_items(self):
        return self.items.count()
    
    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.all())
    
    @property
    def tax_amount(self):
        # Assuming a fixed tax rate of 18% (can be made configurable)
        return round(self.subtotal * Decimal('0.18'), 2)
    
    @property
    def total_amount(self):
        if self.subtotal:
            return self.subtotal + self.tax_amount
        else:
            return 0

    def __str__(self):
        return f"{self.user} - {self.mall}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('cart', 'product')
    
    def __str__(self):
        return f"{self.product.name} ({self.quantity}) - {self.cart.user.email}"
    
    @property
    def total_price(self):
        return self.product.price * self.quantity

