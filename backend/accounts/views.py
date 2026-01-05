from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .models import PaymentMethod
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    PaymentMethodSerializer
)

User = get_user_model()

class LoginView(TokenObtainPairView):
    """
    LOGIN
    - Validates credentials
    - Returns access token + user
    - Stores refresh token in HttpOnly cookie
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        refresh = response.data.pop("refresh")

        response.set_cookie(
            key="refresh_token",
            value=refresh,
            httponly=True,
            secure=True,          # HTTPS only in production
            samesite="Strict",    # CSRF protection
            max_age=60 * 60 * 24  # 1 day
        )
        return response


class UserRegistrationView(APIView):
    """
    REGISTER
    - Creates user
    - Auto-login
    - Sets refresh token in HttpOnly cookie
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=60 * 60 * 24
        )
        return response


class RefreshFromCookie(APIView):
    """
    REFRESH TOKEN
    - Uses HttpOnly cookie
    - Returns new access token
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh = request.COOKIES.get("refresh_token")
        if not refresh:
            return Response({"detail": "No refresh token"}, status=401)

        try:
            token = RefreshToken(refresh)
            return Response({"access": str(token.access_token)})
        except Exception:
            return Response({"detail": "Invalid refresh token"}, status=401)


class LogoutView(APIView):
    """
    LOGOUT
    - Blacklists refresh token
    - Deletes refresh cookie
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.COOKIES.get("refresh_token")

        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except Exception:
                pass

        response = Response({"message": "Logged out successfully"})
        response.delete_cookie("refresh_token")
        return response


class UserProfileView(APIView):
    """
    USER PROFILE
    - GET current user
    - UPDATE profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PaymentMethodListView(generics.ListCreateAPIView):
    """
    LIST & CREATE payment methods
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if serializer.validated_data.get("is_default", False):
            PaymentMethod.objects.filter(
                user=self.request.user,
                payment_type=serializer.validated_data.get("payment_type")
            ).update(is_default=False)

        serializer.save(user=self.request.user)


class PaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    RETRIEVE / UPDATE / DELETE payment method
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get("is_default", False):
            PaymentMethod.objects.filter(
                user=self.request.user,
                payment_type=serializer.validated_data.get("payment_type")
            ).exclude(id=self.get_object().id).update(is_default=False)

        serializer.save()
