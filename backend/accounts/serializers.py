from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import PaymentMethod

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'phone_number', 'profile_image', 'has_credit_card', 'has_upi')
        read_only_fields = ('id', 'email')

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        # fields = ('username', 'email', 'password', 'password2', 
        #          'first_name', 'last_name', 'phone_number')
        extra_kwargs = {
            'password': {'write_only': True},
            # 'first_name': {'required': True},
            # 'last_name': {'required': True},
        }
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that also returns user data"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user details to the response
        data['user'] = UserSerializer(self.user).data
        return data

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