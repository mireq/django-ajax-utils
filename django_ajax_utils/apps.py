# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django import apps
from django.utils.translation import ugettext_lazy as _


class AppConfig(apps.AppConfig):
	name = 'django_ajax_utils'
	verbose_name = _('Django ajax utils')
