from django.urls import path
from .views import (
    MeView,
    LoginView,
    RefreshView,
    AdminLoginView,
    AdminRefreshView,
    CustomerSignupView,
    ManagementSignupView,
    UserProfileView,
    LogoutView,
    PendingManagementUsersView,
    AssignRoleView,
    MasterDashboardStatsView,
    MallAdminDashboardStatsView,
    AdminMeView
)

urlpatterns = [
    # Authentication endpoints
    path("me/", MeView.as_view(), name="auth-me"),
    path("admin/me/", AdminMeView.as_view(), name="auth-me"),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('admin/login/', AdminLoginView.as_view(), name='admin_token_obtain_pair'),
    path('token/refresh/', RefreshView.as_view(), name='token_refresh'),
    path('admin/token/refresh/', AdminRefreshView.as_view(), name='admin_token_refresh'),
    path("signup/customer/", CustomerSignupView.as_view()),
    path("signup/management/", ManagementSignupView.as_view()),
    path('logout/', LogoutView.as_view()),
    
    # User profile
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path("management/pending-users/", PendingManagementUsersView.as_view()),
    path("management/assign-role/", AssignRoleView.as_view()),

    path("admin/dashboard/stats/", MasterDashboardStatsView.as_view(), name="master-dashboard-stats"),
    path("mall/dashboard/stats/", MallAdminDashboardStatsView.as_view(), name="mall-dashboard-stats",
    ),
]