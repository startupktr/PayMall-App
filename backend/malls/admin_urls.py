from django.urls import path
from .admin_views import (
    AdminMallCreateView,
    AdminMallListView,
    AdminMallDetailView,
    AdminMallUpdateView,
    AdminMallToggleStatusView,
)

urlpatterns = [
    path("", AdminMallListView.as_view()),
    path("create/", AdminMallCreateView.as_view()),
    path("<uuid:mall_id>/", AdminMallDetailView.as_view()),
    path("<uuid:mall_id>/update/", AdminMallUpdateView.as_view()),
    path("<uuid:mall_id>/toggle-status/", AdminMallToggleStatusView.as_view()),
]
