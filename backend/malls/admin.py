from django.contrib import admin
from .models import Mall, Offer

class MallAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'address')

admin.site.register(Mall, MallAdmin)
admin.site.register(Offer)