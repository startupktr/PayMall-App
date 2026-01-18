from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User, Profile, UserRole


# ================================
# BASE PROFILE CREATION
# ================================
@receiver(post_save, sender=User)
def create_base_profile(sender, instance, created, **kwargs):
    """
    Create ONE base Profile for every user.
    This must be the ONLY place where Profile is created.
    """
    if created:
        Profile.objects.get_or_create(user=instance)


# ================================
# CUSTOMER SIGNUP HANDLER
# ================================
@receiver(post_save, sender=User)
def handle_customer_signup(sender, instance, created, **kwargs):
    """
    Auto setup for CUSTOMER signup
    - Activate immediately
    - Assign CUSTOMER role
    """
    if not created:
        return

    if instance.signup_source == User.SignupSource.CUSTOMER:
        # Activate customer immediately (no recursive save)
        User.objects.filter(pk=instance.pk).update(is_active=True)

        # Assign CUSTOMER role safely
        UserRole.objects.get_or_create(
            user=instance,
            role=UserRole.Role.CUSTOMER,
        )


# # ================================
# # STAFF / ADMIN SIGNUP HANDLER
# # ================================
# @receiver(post_save, sender=User)
# def handle_staff_signup(sender, instance, created, **kwargs):
#     """
#     Setup for STAFF / ADMIN signup
#     - Do NOT auto-activate
#     - Do NOT auto-assign roles
#     - Approval + role assignment handled by Master Admin
#     """
#     if not created:
#         return

#     if instance.signup_source == User.SignupSource.MANAGEMENT:
#         # Ensure staff users start inactive until approved
#         User.objects.filter(pk=instance.pk).update(is_active=False)
