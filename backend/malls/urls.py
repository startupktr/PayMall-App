from django.urls import path
from .views import (
    NearbyMallView,
    MallOffersView,
    MallView,
)

urlpatterns = [
    path('nearby/', NearbyMallView.as_view(), name='mall_list'),
    path("<uuid:mall_id>/", MallView.as_view()),
    path("offers/", MallOffersView.as_view()),
    
]