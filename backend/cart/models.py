from django.db import models
from django.conf import settings
from products.models import Product
from malls.models import Mall
from decimal import Decimal
from django.db.models import Q

User = settings.AUTH_USER_MODEL

class Cart(models.Model):
    CART_STATUS = (
        ("ACTIVE", "Active"),
    )

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    mall = models.ForeignKey(Mall, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=CART_STATUS,
        default="ACTIVE"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "mall"],
                condition=Q(status="ACTIVE"),
                name="unique_active_cart_per_user_mall",
            )
        ]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "mall"]),
        ]
    
    # @property
    # def total_items(self):
    #     return self.items.count()
    
    # @property
    # def subtotal(self):
    #     return sum((item.total_price for item in self.items.all()), Decimal("0.00"))
    
    # @property
    # def total_amount(self):
    #     return self.subtotal

    def __str__(self):
        return f"{self.user} - {self.mall}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="unique_cart_product")
        ]
    
    def __str__(self):
        return f"{self.product.name} ({self.quantity}) - {self.cart.user.email}"
    
    @property
    def total_price(self):
        return (self.product.price * self.quantity)

