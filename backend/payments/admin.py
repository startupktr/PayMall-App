from django.contrib import admin
from .models import PaymentMethod, Payment, PaymentAttempt

class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('user', 'payment_type', 'is_default', 'created_at')
    list_filter = ('payment_type', 'is_default')
    search_fields = ('user__email', 'user__username')

admin.site.register(PaymentMethod, PaymentMethodAdmin)
admin.site.register(Payment)
admin.site.register(PaymentAttempt)