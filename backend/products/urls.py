from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    ProductBarcodeView,
    MallCategoryListView
)

urlpatterns = [
    path("categories/", MallCategoryListView.as_view(), name="mall-categories"),
    path('list/', ProductListView.as_view(), name='product_list'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product_detail'),
    path('scan/', ProductBarcodeView.as_view(), name='product_barcode'),
]