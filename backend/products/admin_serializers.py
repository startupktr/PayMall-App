from rest_framework import serializers
from .models import Category, Product

class AdminProductCreateUpdateSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    mall_name = serializers.CharField(source='mall.name', read_only=True)
    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "barcode",
            "description",
            "price",
            "marked_price",
            "image",
            "category",
            "stock_quantity",
            "is_available",
            'category_name', 
            'mall_name',
            'discount_percentage'
        )
        read_only_fields = ("id",)

    def validate(self, data):
        price = data.get("price")
        marked_price = data.get("marked_price")

        if price and marked_price and price > marked_price:
            raise serializers.ValidationError(
                "Price cannot be greater than marked price"
            )

        return data
    
class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "image",
            "created_at",
        )
        read_only_fields = ("id", "slug", "created_at")

    def validate_name(self, value):
        if Category.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Category with this name already exists")
        return value
    
class ProductApprovalSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["APPROVE", "REJECT"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["action"] == "REJECT" and not data.get("rejection_reason"):
            raise serializers.ValidationError(
                "Rejection reason is required"
            )
        return data


class BulkProductApprovalSerializer(serializers.Serializer):
    product_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )
    action = serializers.ChoiceField(choices=["APPROVE", "REJECT"])
    rejection_reason = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate(self, data):
        if data["action"] == "REJECT" and not data.get("rejection_reason"):
            raise serializers.ValidationError(
                "Rejection reason is required for bulk rejection"
            )
        return data
