from django.contrib import admin
from .models import Cart, CartItem

# Register your models here.
class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('total_price',)

class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_items', 'subtotal', 'total_amount', 'updated_at')
    inlines = [CartItemInline]
    readonly_fields = ('subtotal', 'total_amount')

admin.site.register(Cart, CartAdmin)