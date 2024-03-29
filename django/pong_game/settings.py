"""
Django settings for pong_game project.

Generated by 'django-admin startproject' using Django 4.2.7.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

import os
from datetime import timedelta
from pathlib import Path

# SECRET_KEY = os.getenv('SECRET_KEY')

SECRET_KEY = os.environ.get("SECRET_KEY", 'my_default_secret_key')

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# Application definition

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

HOSTER_IP = os.getenv('HOSTER_IP')

CSRF_TRUSTED_ORIGINS = ['localhost:8443', HOSTER_IP]

INSTALLED_APPS = [
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	'pong_app',
	'channels',
	'corsheaders',
	'two_factor',
	'django_otp',
	'django_otp.plugins.otp_totp',
	'django_otp.plugins.otp_static',
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

ASGI_APPLICATION = 'pong_game.asgi.application'

CHANNEL_LAYERS = {
	'default': {
		'BACKEND': 'channels.layers.InMemoryChannelLayer',
	}
}

SIMPLE_JWT = {
	'ACCESS_TOKEN_LIFETIME': timedelta(weeks=520),
	'REFRESH_TOKEN_LIFETIME': timedelta(weeks=520),
	'ROTATE_REFRESH_TOKENS': False,
	'BLACKLIST_AFTER_ROTATION': True,
	'UPDATE_LAST_LOGIN': False,

	'ALGORITHM': 'HS256',
	'SIGNING_KEY': SECRET_KEY,
	'VERIFYING_KEY': None,
	'AUDIENCE': None,
	'ISSUER': None,

	'AUTH_HEADER_TYPES': ('Bearer',),
	'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
	'USER_ID_FIELD': 'id',
	'USER_ID_CLAIM': 'user_id',
	'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

	'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
	'TOKEN_TYPE_CLAIM': 'token_type',

	'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
	'SLIDING_TOKEN_LIFETIME': timedelta(weeks=520),
	'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(weeks=520),
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'corsheaders.middleware.CorsMiddleware',
	'two_factor.middleware.threadlocals.ThreadLocals',
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.BCryptPasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
]

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

ALLOWED_HOSTS = ['*']

CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    "https://localhost:8443",
    f"https://{HOSTER_IP}",
]

ROOT_URLCONF = 'pong_game.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'pong_app', 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'pong_game.wsgi.application'

DATABASES = {
  'default': {
      'ENGINE': 'django.db.backends.postgresql',
      'NAME': os.environ.get('DATABASE_NAME', 'postgres'),
      'USER': os.environ.get('DATABASE_USER', 'transcendence_user'),
      'PASSWORD': os.environ.get('DATABASE_PASSWORD', 'transcendence_user'),
      'HOST': 'postgres',
      'PORT': '5432',
  }
}


LOGGING = {
   'version': 1,
   'disable_existing_loggers': False,
   'handlers': {
       'console': {
           'class': 'logging.StreamHandler',
       },
   },
   'root': {
       'handlers': ['console'],
       'level': 'ERROR',
   },
   'loggers': {
       'myproject.consumers': {
           'handlers': ['console'],
           'level': 'ERROR',
           'propagate': False,
       },
   },
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

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
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
