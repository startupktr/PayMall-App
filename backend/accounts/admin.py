from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PaymentMethod

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'has_credit_card', 'has_upi')
    fieldsets = UserAdmin.fieldsets + (
        ('Payment Information', {'fields': ('phone_number', 'profile_image', 'has_credit_card', 'has_upi')}),
    )

class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('user', 'payment_type', 'is_default', 'created_at')
    list_filter = ('payment_type', 'is_default')
    search_fields = ('user__email', 'user__username')

admin.site.register(User, CustomUserAdmin)
admin.site.register(PaymentMethod, PaymentMethodAdmin)
