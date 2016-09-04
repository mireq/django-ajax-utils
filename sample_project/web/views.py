# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.views.generic import TemplateView, FormView

from .forms import SignupForm


class AjaxFormView(FormView):
	form_class = SignupForm


home = TemplateView.as_view(template_name='home.html')
utils = TemplateView.as_view(template_name='utils.html')
ajaxform = AjaxFormView.as_view(template_name='ajaxform.html')
