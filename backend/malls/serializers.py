from rest_framework import serializers
from .models import Mall, Offer


class MallSerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only=True)

    class Meta:
        model = Mall
        fields = (
            "id",
            "name",
            "address",
            "image",
            "description",
            "distance",
        )


class MallDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mall
        fields = "__all__"


class OfferSerializer(serializers.ModelSerializer):
    mall_name = serializers.CharField(source="mall.name", read_only=True)

    class Meta:
        model = Offer
        fields = (
            "id",
            "title",
            "description",
            "image",
            "mall_id",
            "mall_name",
        )

class AdminMallCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mall
        fields = (
            "id",
            "name",
            "description",
            "address",
            "latitude",
            "longitude",
            "image",
            "is_active",
        )
        read_only_fields = ("id",)