from django.db import models
from malls.models import Mall
from django.utils.text import slugify
import uuid
from decimal import Decimal

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='category_images/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name



class Product(models.Model):
    """Model to store product information"""

    PRODUCT_STATUS = (
        ("DRAFT", "Draft"),
        ("PENDING_APPROVAL", "Pending Approval"),
        ("ACTIVE", "Active"),
        ("REJECTED", "Rejected"),
        ("INACTIVE", "Inactive"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=200)
    barcode = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    marked_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    image = models.ImageField(upload_to='product_images/', blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    mall = models.ForeignKey(Mall, on_delete=models.CASCADE, related_name='products')
    
    stock_quantity = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    hsn_code = models.CharField(max_length=20, null=True, blank=True)

     # 🔥 WORKFLOW FIELDS
    status = models.CharField(
        max_length=20,
        choices=PRODUCT_STATUS,
        default="DRAFT",
    )
    approved_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_products",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("barcode", "mall")
        indexes = [
            models.Index(fields=["mall", "is_available"]),
            models.Index(fields=["barcode", "mall"]),
            models.Index(fields=["created_at"]),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate discount percentage if not provided
        if self.marked_price > 0 and self.discount_percentage == 0:
            discount = ((self.marked_price - self.price) / self.marked_price) * 100
            self.discount_percentage = round(discount, 2)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.barcode}"
    
class InventoryAlert(models.Model):
    product = models.OneToOneField(
        Product, on_delete=models.CASCADE, related_name="inventory_alert"
    )
    threshold = models.PositiveIntegerField(default=10)
    is_triggered = models.BooleanField(default=False)
    triggered_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
