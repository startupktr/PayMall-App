from rest_framework import serializers
from .models import Mall, Offer


class MallSerializer(serializers.ModelSerializer):
    """Serializer for Mall model"""
    class Meta:
        model = Mall
        fields = ('id', 'name', 'location', 'description', 'image')


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = "__all__"
