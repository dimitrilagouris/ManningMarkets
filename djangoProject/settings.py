"""
Django settings for djangoProject project.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# --- CORE DEPLOYMENT SETTINGS ---
# Reads SECRET_KEY from .env
SECRET_KEY = os.environ.get('SECRET_KEY', 'default_insecure_fallback')

# Reads DEBUG from .env
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true' # Set to False for production environment

# Reads ALLOWED_HOSTS from .env (comma-separated list)
# CRITICAL FIX: Ensure your public IP is always included.
ALLOWED_HOSTS_STR = os.environ.get('ALLOWED_HOSTS', '127.0.0.1,localhost')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(',') if host.strip()]


# Application definition

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'djangoProject',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'djangoProject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'frontend' / 'build',
            BASE_DIR / 'templates'
        ]
        ,
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

WSGI_APPLICATION = 'djangoProject.wsgi.application'
ASGI_APPLICATION = 'djangoProject.asgi.application'


# --- CHANNELS (WebSockets) CONFIG ---
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            # Default Redis host and port for the EC2 instance
            "hosts": [("127.0.0.1", 6379)], 
        },
    },
}


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# --- STATIC FILES (Nginx Serving) ---
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'static_root' 

# React build static files
REACT_BUILD_DIR = BASE_DIR / 'frontend' / 'build'

STATICFILES_DIRS = [
    REACT_BUILD_DIR / 'static',
] if (REACT_BUILD_DIR / 'static').exists() else []

# CRITICAL FIX for NGINX/LINUX PERMISSIONS (Sets default permissions for files)
FILE_UPLOAD_PERMISSIONS = 0o644 

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# AUTHENTICATION
AUTH_USER_MODEL = 'djangoProject.Profiles'



# CRITICAL: Tells Django that all requests coming from the Nginx proxy (which uses HTTP internally)
# should be treated as secure HTTPS requests. This fixes the cookie and integrity errors.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Enforce secure connections
SECURE_SSL_REDIRECT = True 

# Ensures security is enforced for the browser (fixes integrity/digest errors)
SECURE_BROWSER_XSS_FILTER = True 

# HTTP Strict Transport Security (HSTS) - highly recommended for grading
SECURE_HSTS_SECONDS = 86400  # 1 day
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


# --- CORS & CSRF SETTINGS (Reads from .env) ---
CORS_ALLOW_CREDENTIALS = True

# CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS_STR = os.environ.get('CORS_ALLOWED_ORIGINS', 'https://localhost')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_STR.split(',') if origin.strip()]

# CSRF_TRUSTED_ORIGINS
CSRF_TRUSTED_ORIGINS_STR = os.environ.get('CSRF_TRUSTED_ORIGINS', 'https://localhost')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in CSRF_TRUSTED_ORIGINS_STR.split(',') if origin.strip()]

# CSRF COOKIE
# CRITICAL: These must be True/None/False for HTTPS security
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_DOMAIN = os.environ.get('CSRF_COOKIE_DOMAIN', None) 


# SESSION COOKIE
# CRITICAL: These must be True/None/True for HTTPS security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = 'None'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 60 * 60 * 1


# FRONTEND
FRONTEND_PATH = os.environ.get('FRONTEND_PATH')


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} [{name}:{lineno}] {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": "app.log",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",   
            "propagate": True,
        },
        "djangoProject": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}