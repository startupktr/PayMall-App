from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """
    Custom User model for PayMall application.
    Extends the built-in Django User model to add additional fields.
    """
    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    
    # Payment information (can be extended as needed)
    has_credit_card = models.BooleanField(default=False)
    has_upi = models.BooleanField(default=False)
    
    # Required field for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email

class PaymentMethod(models.Model):
    """Model to store various payment methods for users"""
    PAYMENT_TYPES = (
        ('CREDIT', 'Credit/Debit Card'),
        ('UPI', 'UPI Payment'),
        ('CASH', 'Cash Payment'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
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
