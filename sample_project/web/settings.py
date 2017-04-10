import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = 'secret_key'

DEBUG = True

ALLOWED_HOSTS = []

INSTALLED_APPS = [
	#'django.contrib.auth',
	#'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	'django_ajax_utils',
]

MIDDLEWARE = [
	#'django.middleware.security.SecurityMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	#'django.middleware.common.CommonMiddleware',
	#'django.middleware.csrf.CsrfViewMiddleware',
	#'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	#'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'django_ajax_utils.middleware.RemoveDummyParametersMiddleware',
	'django_ajax_utils.pjax.Middleware',
]

ROOT_URLCONF = 'web.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [os.path.join(BASE_DIR, 'templates'),],
		'OPTIONS': {
			'context_processors': [
				#'django.template.context_processors.debug',
				'django.template.context_processors.request',
				#'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
			'loaders': [
				'django_ajax_utils.pjax.Loader',
				'django.template.loaders.filesystem.Loader',
				'django.template.loaders.app_directories.Loader',
			],
		},
	},
]

WSGI_APPLICATION = 'web.wsgi.application'


DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.sqlite3',
		'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
	}
}

PJAX_INCLUDE_URLPATTERNS = [r'.*']
PJAX_EXCLUDE_URLPATTERNS = [r'^admin:.*$']

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = False

USE_L10N = False

USE_TZ = False

STATIC_URL = '/static/'

STATICFILES_DIRS = (os.path.join(BASE_DIR, 'static'),)
