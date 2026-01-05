from django.contrib import admin
from .models import Category, Product

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'barcode', 'price', 'marked_price', 'discount_percentage', 
                    'category', 'mall', 'stock_quantity', 'is_available')
    list_filter = ('is_available', 'category', 'mall')
    search_fields = ('name', 'barcode', 'description')
    readonly_fields = ('discount_percentage',)


admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)