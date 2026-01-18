from django.urls import path
from .views import (
    AddToCartView,
    CartView,
    CartItemUpdateView,
    RemoveCartItemView,
    ClearCartView,
    MergeGuestCartView,
)

urlpatterns = [
    path("", CartView.as_view()),
    path("merge-guest/", MergeGuestCartView.as_view()),
    path("add/", AddToCartView.as_view()),
    path("item/update/", CartItemUpdateView.as_view()),
    path("item/remove/", RemoveCartItemView.as_view()),
    path("clear/", ClearCartView.as_view()),
]
