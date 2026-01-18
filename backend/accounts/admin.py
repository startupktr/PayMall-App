from django.contrib import admin
from .models import User, Profile, UserRole

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "signup_source",
        "is_active",
        "date_joined",
    )
    list_filter = ("signup_source", "is_active")
    search_fields = ("email", "phone_number")
    ordering = ("-date_joined",)

    actions = ["activate_users"]

    def activate_users(self, request, queryset):
        queryset.update(is_active=True)

    activate_users.short_description = "Activate selected users"


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__email",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name")
    search_fields = ("user__email", "full_name")