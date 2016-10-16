# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import messages
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


class MessagesView(TemplateView):
	def get(self, request, *args, **kwargs):
		messages.info(self.request, "Info message")
		messages.success(self.request, "Success message")
		messages.warning(self.request, "Warning message")
		messages.error(self.request, "Error message")
		return super(MessagesView, self).get(request, *args, **kwargs)


home_view = TemplateView.as_view(template_name='home.html')
utils_view = TemplateView.as_view(template_name='utils.html')
ajaxform_view = AjaxFormView.as_view(template_name='ajaxform.html')
messages_view = MessagesView.as_view(template_name='messages.html')
