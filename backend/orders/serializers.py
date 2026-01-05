from rest_framework import serializers
from .models import Order, OrderItem
from malls.serializers import MallSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_price', 
                 'product_barcode', 'quantity', 'total_price')

class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order (list view)"""
    mall = MallSerializer(read_only=True)
    class Meta:
        model = Order
        fields = ('id', 'order_number', 'status', 'payment_status', 'mall', 
                 'payment_method', 'total', 'created_at')

class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer for order (detail view)"""
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ('id', 'order_number', 'user', 'mall', 'status', 
                 'payment_status', 'payment_method', 'subtotal', 
                 'tax', 'total', 'items', 'created_at')

class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating an order"""
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD)
    
    def validate_payment_method(self, value):
        # Additional validation can be added here if needed
        return value