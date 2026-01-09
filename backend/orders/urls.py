from django.urls import path
from .views import (
    OrderCreateView,
    OrderDetailView,
    OrderListView,
    OrderCancelView
)

urlpatterns = [
    path("list/", OrderListView.as_view()),
    path("create/", OrderCreateView.as_view()),
    path("<int:pk>/", OrderDetailView.as_view()),
    path("<int:pk>/cancel/", OrderCancelView.as_view()),
]