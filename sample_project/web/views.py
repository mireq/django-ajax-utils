# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.views.generic import TemplateView


home = TemplateView.as_view(template_name='home.html')
utils = TemplateView.as_view(template_name='utils.html')
