from rest_framework import serializers
from .models import PaymentMethod

class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for payment methods"""
    class Meta:
        model = PaymentMethod
        fields = ('id', 'payment_type', 'card_number_last_four', 'card_expiry', 
                 'upi_id', 'is_default', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def validate(self, data):
        """Validate payment method data based on type"""
        payment_type = data.get('payment_type')
        
        if payment_type == 'CREDIT':
            if not data.get('card_number_last_four') or not data.get('card_expiry'):
                raise serializers.ValidationError("Card details are required for credit/debit card payment.")
        
        elif payment_type == 'UPI':
            if not data.get('upi_id'):
                raise serializers.ValidationError("UPI ID is required for UPI payment.")
        
        return data