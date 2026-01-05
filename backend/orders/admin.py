from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'product_price', 'product_barcode', 'total_price')

class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'mall', 'status', 'payment_status', 
                    'payment_method', 'total', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method', 'mall')
    search_fields = ('order_number', 'user__email', 'user__username')
    readonly_fields = ('subtotal', 'tax', 'total')
    inlines = [OrderItemInline]

admin.site.register(Order, OrderAdmin)