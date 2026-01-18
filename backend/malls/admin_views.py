from rest_framework.views import APIView
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from common.responses import success_response, error_response
from accounts.utils import is_master_admin
from .models import Mall, MallStaff
from .serializers import AdminMallCreateUpdateSerializer
from accounts.permissions import IsMasterAdmin


class AdminMallCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMasterAdmin]

    def post(self, request):
        serializer = AdminMallCreateUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        mall = serializer.save()

        return success_response(
            message="Mall created successfully",
            data=AdminMallCreateUpdateSerializer(mall).data,
            status=status.HTTP_201_CREATED,
        )

class AdminMallListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if is_master_admin(request.user):
            malls = Mall.objects.all()
        else:
            malls = Mall.objects.filter(
                staff__user=request.user
            )

        serializer = AdminMallCreateUpdateSerializer(malls, many=True)

        return success_response(
            message="Malls fetched successfully",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

class AdminMallDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, mall_id):
        mall = get_object_or_404(Mall, id=mall_id)

        if not (
            is_master_admin(request.user)
            or MallStaff.objects.filter(user=request.user, mall=mall).exists()
        ):
            return error_response(
                message="Access denied",
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdminMallCreateUpdateSerializer(mall)

        return success_response(
            message="Mall details fetched",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

class AdminMallUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, mall_id):
        mall = get_object_or_404(Mall, id=mall_id)

        if not (
            is_master_admin(request.user)
            or MallStaff.objects.filter(user=request.user, mall=mall).exists()
        ):
            return error_response(
                message="Access denied",
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdminMallCreateUpdateSerializer(
            mall, data=request.data, partial=True
        )

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return success_response(
            message="Mall updated successfully",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

class AdminMallToggleStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMasterAdmin]

    def patch(self, request, mall_id):
        mall = get_object_or_404(Mall, id=mall_id)

        mall.is_active = not mall.is_active
        mall.save(update_fields=["is_active"])

        return success_response(
            message=f"Mall {'activated' if mall.is_active else 'deactivated'}",
            data={"is_active": mall.is_active},
            status=status.HTTP_200_OK,
        )

