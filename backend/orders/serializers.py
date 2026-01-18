from rest_framework import serializers
from .models import Order, OrderItem
from malls.serializers import MallSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    class Meta:
        model = OrderItem
        fields = (
            'id',
            'product',
            'product_name', 
            'product_price', 
            'product_barcode', 
            'quantity',
            "gst_rate",
            "taxable_value",
            "tax_amount",
            "cgst_amount",
            "sgst_amount",
            'total_price',
        )

class OrderListSerializer(serializers.ModelSerializer):
    mall_name = serializers.CharField(source="mall.name", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "payment_status",
            "total",
            "mall_name",
            "created_at",
        )

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "payment_status",
            "subtotal",
            "tax",
            "cgst",
            "sgst",
            "igst",
            "total",
            "items",
            "created_at",
        )

class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating an order"""
    
    def validate_payment_method(self, value):
        # Additional validation can be added here if needed
        return value