from django.contrib import admin
from .models import Mall, Offer,MallStaff

class MallAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'address')


@admin.register(MallStaff)
class MallStaffAdmin(admin.ModelAdmin):
    list_display = ("user", "mall", "role")
    search_fields = ("user__email", "mall__name")

admin.site.register(Mall, MallAdmin)
admin.site.register(Offer)