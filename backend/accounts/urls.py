from django.urls import path
from .views import (
    MeView,
    LoginView,
    RefreshView,
    UserRegistrationView,
    UserProfileView,
    PaymentMethodListView,
    PaymentMethodDetailView,
    LogoutView
)

urlpatterns = [
    # Authentication endpoints
    path("me/", MeView.as_view(), name="auth-me"),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', RefreshView.as_view(), name='token_refresh'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('logout/', LogoutView.as_view()),
    
    # User profile
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    
    # Payment methods
    path('payment-methods/', PaymentMethodListView.as_view(), name='payment_method_list'),
    path('payment-methods/<int:pk>/', PaymentMethodDetailView.as_view(), name='payment_method_detail'),
]