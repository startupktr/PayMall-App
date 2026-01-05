from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentSuccessView
)

urlpatterns = [
    path("initiate/", InitiatePaymentView.as_view()),
    path("success/", PaymentSuccessView.as_view()),
]