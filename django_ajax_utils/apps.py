# -*- coding: utf-8 -*-
from django import apps
from django.utils.translation import gettext_lazy as _


class AppConfig(apps.AppConfig):
	name = 'django_ajax_utils'
	verbose_name = _('Django ajax utils')
