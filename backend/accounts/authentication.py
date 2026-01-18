from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CookieJWTAuthentication(JWTAuthentication):
    """
    Read JWT access token from HttpOnly cookie instead of Authorization header
    """

    def authenticate(self, request):
        access_token = request.COOKIES.get(
            settings.SIMPLE_JWT["AUTH_COOKIE"]
        )

        if not access_token:
            return None  # DRF will treat as unauthenticated

        validated_token = self.get_validated_token(access_token)
        return self.get_user(validated_token), validated_token
