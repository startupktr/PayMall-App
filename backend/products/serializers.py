from rest_framework import serializers
from .models import Category, Product
from malls.serializers import MallSerializer

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "image",
            "product_count",
        ]

class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model (list view)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    mall_name = serializers.CharField(source='mall.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'barcode', 'description', 'price', 'marked_price', 
                 'discount_percentage', 'image', 'category', 'category_name', 
                 'mall', 'mall_name', 'stock_quantity', 'is_available')
        
class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Product model (detail view)"""
    category = CategorySerializer(read_only=True)
    mall = MallSerializer(read_only=True)
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'barcode', 'description', 'price', 'marked_price', 
                 'discount_percentage', 'image', 'category', 'mall', 
                 'stock_quantity', 'is_available', 'created_at', 'updated_at')
        