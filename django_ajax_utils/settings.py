# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf import settings


DUMMY_PARAMETER_NAMES = getattr(settings, "DUMMY_PARAMETER_NAMES", ['_dummy'])
