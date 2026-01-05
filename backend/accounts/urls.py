from django.urls import path
from .views import (
    LoginView,
    RefreshFromCookie,
    UserRegistrationView,
    UserProfileView,
    PaymentMethodListView,
    PaymentMethodDetailView,
    LogoutView
)

urlpatterns = [
    # Authentication endpoints
    path('token/', LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', RefreshFromCookie.as_view(), name='token_refresh'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('logout/', LogoutView.as_view()),
    
    # User profile
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    
    # Payment methods
    path('payment-methods/', PaymentMethodListView.as_view(), name='payment_method_list'),
    path('payment-methods/<int:pk>/', PaymentMethodDetailView.as_view(), name='payment_method_detail'),
]