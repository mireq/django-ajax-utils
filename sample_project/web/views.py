# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.core.urlresolvers import reverse
from django.http.response import HttpResponseRedirect
from django.views.generic import TemplateView, FormView

from .forms import SignupForm
from django_ajax_utils.views import AjaxFormMixin


class AjaxFormView(AjaxFormMixin, FormView):
	form_class = SignupForm

	def form_valid(self, form):
		if not self.only_validate_form:
			return HttpResponseRedirect(reverse('home'))
		return super(AjaxFormView, self).form_valid(form)


home = TemplateView.as_view(template_name='home.html')
utils = TemplateView.as_view(template_name='utils.html')
ajaxform = AjaxFormView.as_view(template_name='ajaxform.html')
