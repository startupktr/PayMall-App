from django.urls import path
from .views import (
    NearbyMallView,
    MallOffersView,
)

urlpatterns = [
    path('nearby/', NearbyMallView.as_view(), name='mall_list'),
    # path("<int:mall_id>/offers/", MallOfferView.as_view()),
    path("offers/", MallOffersView.as_view()),

]