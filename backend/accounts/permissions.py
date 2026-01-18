from rest_framework.permissions import BasePermission
from malls.models import MallStaff
from accounts.utils import is_customer, is_master_admin, is_mall_admin

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            is_master_admin(request.user) or is_mall_admin(request.user)
        )
    
    
class IsMasterAdmin(BasePermission):
    message = "Master admin access required"

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.roles.filter(role="MASTER_ADMIN").exists()


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_active
            and request.user.roles.exists()
        )

class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return is_customer(request.user)

class IsMallAdmin(BasePermission):
    message = "Mall admin access required"

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.roles.filter(role="MALL_ADMIN").exists()
    
class IsMallAdminForMall(BasePermission):
    def has_object_permission(self, request, view, obj):
        return MallStaff.objects.filter(
            user=request.user,
            mall=obj
        ).exists()

class IsMallAdminForObject(BasePermission):
    def has_object_permission(self, request, view, obj):
        return MallStaff.objects.filter(
            user=request.user,
            mall=obj.mall
        ).exists()
