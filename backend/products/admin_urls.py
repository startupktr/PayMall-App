from django.urls import path
from products.admin_views import (
    AdminProductCreateView,
    AdminProductListView,
    AdminProductUpdateView,
    AdminProductToggleAvailabilityView,
    AdminProductBulkUploadView,

    AdminCategoryCreateView,
    AdminCategoryListView,
    AdminCategoryUpdateView,
    AdminCategoryDeactivateView,
    AdminLowStockProductsView,
    BulkProductApprovalView,
)

urlpatterns = [
    path("products/", AdminProductListView.as_view()),
    path("products/create/", AdminProductCreateView.as_view()),
    path("products/<uuid:product_id>/update/", AdminProductUpdateView.as_view()),
    path("products/<uuid:product_id>/toggle/", AdminProductToggleAvailabilityView.as_view()),
    path("products/bulk-upload/", AdminProductBulkUploadView.as_view()),
    path("products/bulk-approval/", BulkProductApprovalView.as_view()),


    path("categories/", AdminCategoryListView.as_view()),
    path("categories/create/", AdminCategoryCreateView.as_view()),
    path("categories/<uuid:category_id>/update/", AdminCategoryUpdateView.as_view()),
    path("categories/<uuid:category_id>/toggle/", AdminCategoryDeactivateView.as_view()),

    path("low-stock/", AdminLowStockProductsView.as_view()),

]
