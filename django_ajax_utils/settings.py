# -*- coding: utf-8 -*-
from django.conf import settings


DUMMY_PARAMETER_NAMES = getattr(settings, "DUMMY_PARAMETER_NAMES", ['_dummy'])
FORMUTILS_ROW_TEMPLATE_ATTRIBUTE = '_formrow_template'
FORMUTILS_DEFAULT_ROW_TEMPLATE = getattr(settings, "FORMUTILS_DEFAULT_ROW_TEMPLATE", None)
FORMUTILS_DEFAULT_LAYOUT_TEMPLATE = getattr(settings, "FORMUTILS_DEFAULT_LAYOUT_TEMPLATE", None)
FORMUTILS_DEFAULT_ROW_TEMPLATE_GET = getattr(settings, "FORMUTILS_DEFAULT_ROW_TEMPLATE_GET", None)
FORMUTILS_DEFAULT_LAYOUT_TEMPLATE_GET = getattr(settings, "FORMUTILS_DEFAULT_LAYOUT_TEMPLATE_GET", None)
GET_CURRENT_REQUEST_CALLBACK = getattr(settings, "GET_CURRENT_REQUEST_CALLBACK", None)
