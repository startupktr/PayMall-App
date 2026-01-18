from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentSuccessView,
    PaymentFailedView,
    PaymentMethodListView,
    PaymentMethodDetailView
)

urlpatterns = [
    path("initiate/", InitiatePaymentView.as_view()),
    path("success/", PaymentSuccessView.as_view()),
    path("failed/", PaymentFailedView.as_view()),

    # Payment methods
    path('payment-methods/', PaymentMethodListView.as_view(), name='payment_method_list'),
    path('payment-methods/<int:pk>/', PaymentMethodDetailView.as_view(), name='payment_method_detail'),
]