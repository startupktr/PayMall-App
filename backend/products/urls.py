from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    ProductBarcodeView
)

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product_list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product_detail'),
    path('products/scan/', ProductBarcodeView.as_view(), name='product_barcode'),
]