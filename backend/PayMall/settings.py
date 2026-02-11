from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ===============================
# ENV DETECTION (ADD ONLY)
# ===============================
ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"

# ===============================
# SECURITY
# ===============================
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = not IS_PRODUCTION

if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set in environment")

# ===============================
# ALLOWED HOSTS (ADD DEV IP SUPPORT)
# ===============================
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")

if not ALLOWED_HOSTS or ALLOWED_HOSTS == [""]:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]


# ===============================
# APPLICATIONS
# ===============================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    'accounts',
    'malls',
    'products',
    'cart',
    'orders',
    'payments',
]

# ===============================
# MIDDLEWARE
# ===============================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'PayMall.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'PayMall.wsgi.application'

# ===============================
# DATABASE
# ===============================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ===============================
# AUTH / REST
# ===============================
AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "accounts.authentication.CookieJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

# ===============================
# JWT (UNCHANGED FOR PROD)
# ===============================
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),

    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,

    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,

    "AUTH_COOKIE": "access_token",
    "AUTH_COOKIE_REFRESH": "refresh_token",

    # 🔒 PROD SAFE (UNCHANGED)
    "AUTH_COOKIE_SECURE": IS_PRODUCTION,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_PATH": "/",
    "AUTH_COOKIE_SAMESITE": "None" if IS_PRODUCTION else "Lax",
    "AUTH_COOKIE_DOMAIN": ".paymall.live" if IS_PRODUCTION else None,

}

CORS_ALLOW_CREDENTIALS = True

if IS_PRODUCTION:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = os.getenv(
        "CORS_ALLOWED_ORIGINS", ""
    ).split(",")
else:
    CORS_ALLOW_ALL_ORIGINS = True

if IS_PRODUCTION:
    CSRF_TRUSTED_ORIGINS = os.getenv(
        "CSRF_TRUSTED_ORIGINS", ""
    ).split(",")
else:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]


CSRF_COOKIE_SECURE = IS_PRODUCTION
CSRF_COOKIE_SAMESITE = "None" if IS_PRODUCTION else "Lax"
SESSION_COOKIE_SECURE = IS_PRODUCTION

# ===============================
# STATIC / MEDIA
# ===============================
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if IS_PRODUCTION:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_HTTPONLY = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
