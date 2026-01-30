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
ENV = os.getenv("ENV", "production")
IS_PRODUCTION = ENV == "production"

# ===============================
# SECURITY
# ===============================
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG", "False") == "True"

# ===============================
# ALLOWED HOSTS (ADD DEV IP SUPPORT)
# ===============================
ALLOWED_HOSTS = [
    "api.paymall.live",
    "paymall.live",
    "merchant.paymall.live",
    "www.paymall.live",
    "localhost",
    "127.0.0.1",
]

# ===============================
# DEV-ONLY HOST ALLOW (SAFE)
# ===============================
if os.getenv("ENV") == "development":
    ALLOWED_HOSTS += [
        "192.168.0.165",   # your PC LAN IP
        "0.0.0.0",
    ]

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
    "AUTH_COOKIE_SECURE": True,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_PATH": "/",
    "AUTH_COOKIE_SAMESITE": "None",
}

# ===============================
# CORS (PROD UNCHANGED)
# ===============================
CORS_ALLOWED_ORIGINS = [
    "https://paymall.live",
    "https://www.paymall.live",
    "https://merchant.paymall.live",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^null$",
]

# ===============================
# CSRF (PROD UNCHANGED)
# ===============================
CSRF_TRUSTED_ORIGINS = [
    "https://paymall.live",
    "https://www.paymall.live",
    "https://merchant.paymall.live",
    "https://api.paymall.live",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "None"

# ===============================
# DEV-ONLY OVERRIDES (SAFE)
# ===============================
if not IS_PRODUCTION:
    # 🔓 allow Expo / mobile / LAN
    CORS_ALLOW_ALL_ORIGINS = True

    # 🔓 allow HTTP cookies in dev
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SECURE = False

    # 🔓 allow JWT cookies over HTTP
    SIMPLE_JWT["AUTH_COOKIE_SECURE"] = False
    SIMPLE_JWT["AUTH_COOKIE_SAMESITE"] = "Lax"

# ===============================
# STATIC / MEDIA
# ===============================
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
