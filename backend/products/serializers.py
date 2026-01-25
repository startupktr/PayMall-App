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
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'barcode', 'description', 'price', 'marked_price', 
                 'discount_percentage', 'image', 'category', 'category_name', 
                 'mall', 'mall_name', 'stock_quantity', 'is_available')
        
    def get_image(self, obj):
        if not obj.image:
            return None
        
        request = self.context.get("request")
        
        # ✅ if request exists → absolute url
        if request:
            return request.build_absolute_uri(obj.image.url)

        # ✅ fallback → still return relative
        return obj.image.url

        
class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Product model (detail view)"""
    category = CategorySerializer(read_only=True)
    mall = MallSerializer(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'barcode', 'description', 'price', 'marked_price', 
                 'discount_percentage', 'image', 'category', 'mall', 
                 'stock_quantity', 'is_available', 'created_at', 'updated_at')
        
    def get_image(self, obj):
        if not obj.image:
            return None
        
        request = self.context.get("request")
        
        # ✅ if request exists → absolute url
        if request:
            return request.build_absolute_uri(obj.image.url)

        # ✅ fallback → still return relative
        return obj.image.url
