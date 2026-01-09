from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'has_credit_card', 'has_upi')
    fieldsets = UserAdmin.fieldsets + (
        ('Payment Information', {'fields': ('phone_number', 'profile_image', 'has_credit_card', 'has_upi')}),
    )

admin.site.register(User, CustomUserAdmin)
