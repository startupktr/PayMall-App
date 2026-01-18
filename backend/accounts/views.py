from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from .models import User, UserRole
from malls.models import Mall, MallStaff
from .permissions import IsMasterAdmin, IsMallAdmin
from products.models import Product, Category
from orders.models import Order
from common.responses import success_response, error_response
from django.conf import settings
from django.middleware import csrf
from django.contrib.auth import authenticate
from .serializers import (
    UserSerializer,
    CustomerSignupSerializer,
    ManagementSignupSerializer,
    CustomTokenObtainPairSerializer,
    PendingManagementUserSerializer,
    AssignRoleSerializer,
)

def set_auth_cookies(response, refresh):
    response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE"],
        value=str(refresh.access_token),
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
        max_age=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds(),
    )

    response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
        value=str(refresh),
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
        max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds(),
    )


def clear_auth_cookies(response):
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"])
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"])

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except AuthenticationFailed as e:
            return error_response(
                message=str(e),
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return success_response(
            message="Login successful",
            data=serializer.validated_data,
            status=status.HTTP_200_OK,
        )

class AdminLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(email=email, password=password)
        if not user:
            return Response(
                {"message": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        refresh = RefreshToken.for_user(user)
        response = Response({"message": "Login successful"})
        set_auth_cookies(response, refresh)

        csrf.get_token(request)  # CSRF cookie
        return response
    
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return success_response(
            data=UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )

class AdminMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        roles = list(user.roles.values_list("role", flat=True))
        assigned_malls = [
            {"id": ms.mall.id, "name": ms.mall.name}
            for ms in MallStaff.objects
                .filter(user=user)
                .select_related("mall")
        ]

        return success_response(
            data={
                "id": user.id,
                "email": user.email,
                "roles": roles,
                "assigned_malls": assigned_malls,
            },
            status=status.HTTP_200_OK,
        )
    
class CustomerSignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CustomerSignupSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return success_response(
            message="Customer registered successfully",
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
    
class ManagementSignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ManagementSignupSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        serializer.save()

        return success_response(
            message="Signup successful. Waiting for admin approval.",
            status=status.HTTP_201_CREATED,
        )


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh = request.data.get("refresh")

        if not refresh:
            return error_response(
                message="Refresh token is required",
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh)
            return success_response(
                message="Token refreshed",
                data={"access": str(token.access_token)},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return error_response(
                message="Invalid refresh token",
                status=status.HTTP_401_UNAUTHORIZED,
            )

class AdminRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")
        if not refresh_token:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken(refresh_token)
        response = Response({"message": "Token refreshed"})
        set_auth_cookies(response, refresh)
        return response

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # def post(self, request):
    #     refresh = request.data.get("refresh")
        # if refresh:
        #     RefreshToken(refresh).blacklist()

    #     return Response({"message": "Logged out"})

    def post(self, request):
        response = success_response(
            message="Logged out successfully",
            status=status.HTTP_200_OK,
        )
        clear_auth_cookies(response)
        return response

class PendingManagementUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMasterAdmin]

    def get(self, request):
        users = User.objects.filter(
            signup_source=User.SignupSource.MANAGEMENT,
            is_active=False,
        ).exclude(roles__isnull=False)

        serializer = PendingManagementUserSerializer(users, many=True)

        return success_response(
            message="Pending management users fetched",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

class AssignRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMasterAdmin]

    def post(self, request):
        serializer = AssignRoleSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_object_or_404(User, id=serializer.validated_data["user_id"])
        role = serializer.validated_data["role"]
        mall_id = serializer.validated_data.get("mall_id")

        # Prevent duplicate role
        if user.roles.filter(role=role).exists():
            return error_response(
                message="User already has this role",
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Assign role
        UserRole.objects.create(user=user, role=role)

        # Assign mall if Mall Admin
        if role == UserRole.Role.MALL_ADMIN:
            mall = get_object_or_404(Mall, id=mall_id)
            MallStaff.objects.create(
                user=user,
                mall=mall,
                role="MALL_ADMIN",
            )

        # Activate user
        user.is_active = True
        user.save(update_fields=["is_active"])

        return success_response(
            message="Role assigned and user activated successfully",
            data={
                "user_id": str(user.id),
                "role": role,
                "mall_id": mall_id,
            },
            status=status.HTTP_200_OK,
        )


class UserProfileView(APIView):
    """
    USER PROFILE
    - GET current user
    - UPDATE profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return success_response(
            message="Profile fetched successfully",
            data=UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        return success_response(
            message="Profile Updated successfully",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )


class MasterDashboardStatsView(APIView):
    permission_classes = [IsMasterAdmin]

    def get(self, request):
        """
        MASTER ADMIN DASHBOARD STATS
        """

        total_malls = Mall.objects.filter(is_active=True).count()

        products_qs = Product.objects.all()

        total_products = products_qs.count()
        active_products = products_qs.filter(is_available=True).count()
        low_stock_products = products_qs.filter(stock_quantity__lt=10).count()

        total_categories = Category.objects.count()

        total_mall_admins = UserRole.objects.filter(
            role="MALL_ADMIN"
        ).count()

        data = {
            "total_malls": total_malls,
            "total_products": total_products,
            "active_products": active_products,
            "low_stock_products": low_stock_products,
            "total_categories": total_categories,
            "total_mall_admins": total_mall_admins,
        }

        return success_response(
            message="Dashboard stats fetched successfully",
            data=data,
            status=status.HTTP_200_OK,
        )
    

class MallAdminDashboardStatsView(APIView):
    permission_classes = [IsMallAdmin]

    def get(self, request):
        """
        MALL ADMIN DASHBOARD STATS
        """

        # 🔒 Get mall assigned to this admin
        mall_admin = MallStaff.objects.filter(user=request.user).first()

        if not mall_admin:
            return error_response(
                message="Mall not assigned to this admin",
                status=status.HTTP_403_FORBIDDEN,
            )

        mall = mall_admin.mall

        products_qs = Product.objects.filter(mall=mall)

        total_products = products_qs.count()
        active_products = products_qs.filter(is_available=True).count()
        low_stock_products = products_qs.filter(stock_quantity__lt=10).count()

        total_orders = Order.objects.filter(mall=mall).count()
        pending_orders = Order.objects.filter(
            mall=mall, status="PAYMENT_PENDING"
        ).count()
        completed_orders = Order.objects.filter(
            mall=mall, status="PAID"
        ).count()

        data = {
            "mall": {
                "id": str(mall.id),
                "name": mall.name,
            },
            "stats": {
                "total_products": total_products,
                "active_products": active_products,
                "low_stock_products": low_stock_products,
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "completed_orders": completed_orders,
            },
        }

        return success_response(
            message="Mall dashboard stats fetched successfully",
            data=data,
            status=status.HTTP_200_OK,
        )
