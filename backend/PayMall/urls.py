from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# API URL patterns
api_urlpatterns = [
    path('users/', include('accounts.urls')),
    path('cart/', include('cart.urls')),
    path('malls/', include('malls.urls')),
    path('orders/', include('orders.urls')),
    path('payments/', include('payments.urls')),
    path('products/', include('products.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(api_urlpatterns)),  # All API endpoints under /api/
]

# Serve media files in development
if settings.DEBUG:
    # Add this line for CSS/JS files
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # This serves your uploaded media files
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)