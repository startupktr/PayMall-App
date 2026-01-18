from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, UserRole

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    full_name = serializers.CharField(source="profile.full_name", read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "phone_number",
            "signup_source",
            "is_active",
            "roles",
            "full_name",
            "avatar",
        )
        read_only_fields = ("id", "email", "signup_source", "is_active")

    def get_roles(self, obj):
        return list(obj.roles.values_list("role", flat=True))
    
    def get_avatar(self, obj):
        if obj.profile.avatar:
            request = self.context.get("request")
            url = obj.profile.avatar.url
            return request.build_absolute_uri(url) if request else url
        return None

class CustomerSignupSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "password", "password2", "phone_number")
        extra_kwargs = {"password": {"write_only": True}}

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop("password2")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            phone_number=validated_data.get("phone_number"),
            signup_source=User.SignupSource.CUSTOMER,
            is_approved = True,
        )
        return user

class ManagementSignupSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "password", "password2")
        extra_kwargs = {"password": {"write_only": True}}

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop("password2")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            signup_source=User.SignupSource.MANAGEMENT,
            is_approved=False,   # 🔒 blocked until role assigned
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    username_field = "email"   # 👈 login via email

    def validate(self, attrs):
        data = super().validate(attrs)

        # 🔒 BLOCK users with no roles or inactive
        if not self.user.is_active:
            raise serializers.ValidationError(
                "Account not activated. Please contact admin."
            )

        if not self.user.roles.exists():
            raise serializers.ValidationError(
                "No role assigned. Access denied."
            )

        data["user"] = UserSerializer(self.user).data
        return data

class PendingManagementUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "created_at")

class AssignRoleSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(
        choices=[UserRole.Role.MASTER_ADMIN, UserRole.Role.MALL_ADMIN]
    )
    mall_id = serializers.UUIDField(required=False)

    def validate(self, data):
        role = data["role"]

        if role == UserRole.Role.MALL_ADMIN and not data.get("mall_id"):
            raise serializers.ValidationError(
                {"mall_id": "Mall is required for Mall Admin"}
            )

        return data
