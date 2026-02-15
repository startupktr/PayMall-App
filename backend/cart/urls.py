from django.urls import path
from .views import (
    AddToCartView,
    CartView,
    CartItemUpdateView,
    RemoveCartItemView,
    ClearCartView,
    MergeGuestCartView,
    ReplaceCartView,
    SaveCartView,
    SavedCartListView,
    RestoreSavedCartView
)

urlpatterns = [
    path("", CartView.as_view()),
    path("merge-guest/", MergeGuestCartView.as_view()),
    path("add/", AddToCartView.as_view()),
    path("replace/", ReplaceCartView.as_view()),
    path("item/update/", CartItemUpdateView.as_view()),
    path("item/remove/", RemoveCartItemView.as_view()),
    path("clear/", ClearCartView.as_view()),
    path("save/", SaveCartView.as_view()),
    path("saved/", SavedCartListView.as_view()),
    path("saved/restore/", RestoreSavedCartView.as_view()),
]
