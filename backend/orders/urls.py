from django.urls import path
from .views import (
    OrderCreateView,
    OrderDetailView,
    OrderListView,
    OrderCancelView,
    OrderInvoiceView,
    OrderInvoiceDataView
)

urlpatterns = [
    path("list/", OrderListView.as_view()),
    path("create/", OrderCreateView.as_view()),
    path("<int:pk>/", OrderDetailView.as_view()),
    path("<int:pk>/cancel/", OrderCancelView.as_view()),
    # path("<int:pk>/invoice/", OrderInvoiceView.as_view()),

    path('<int:pk>/invoice-data/', OrderInvoiceDataView.as_view(), name='order-invoice-data'),
    
    # For web - returns PDF file
    path('<int:pk>/invoice/', OrderInvoiceView.as_view(), name='order-invoice'),
]