# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import messages
from django.http.response import HttpResponseRedirect
from django.urls import reverse
from django.views.generic import TemplateView, FormView

from .forms import SignupForm, SimpleForm, MessagesForm, SimpleFormSet
from django_ajax_utils import multiforms
from django_ajax_utils.views import AjaxFormMixin


class AjaxFormView(AjaxFormMixin, FormView):
	form_class = SignupForm

	def form_valid(self, form):
		if not self.only_validate_form:
			return HttpResponseRedirect(reverse('home'))
		return super(AjaxFormView, self).form_valid(form)


class FormsetView(AjaxFormMixin, FormView):
	form_class = SimpleFormSet

	def form_valid(self, form):
		if not self.only_validate_form:
			return HttpResponseRedirect(reverse('home'))
		return super(FormsetView, self).form_valid(form)


class MessagesView(FormView):
	form_class = MessagesForm

	def get(self, request, *args, **kwargs):
		messages.info(self.request, "Test message")
		return super(MessagesView, self).get(request, *args, **kwargs)

	def form_valid(self, form):
		data = form.cleaned_data
		messages.add_message(self.request, level=data['level'], message=data['message'])
		return self.render_to_response(self.get_context_data(form=form))


class PjaxMessagesView(TemplateView):
	def get(self, request, *args, **kwargs):
		messages.info(self.request, "Test message")
		return super(PjaxMessagesView, self).get(request, *args, **kwargs)


class PjaxFormPostView(AjaxFormMixin, FormView):
	form_class = MessagesForm

	def form_valid(self, form):
		if self.only_validate_form:
			return self.render_to_response(self.get_context_data(form=form))
		data = form.cleaned_data
		messages.add_message(self.request, level=data['level'], message=data['message'])
		return HttpResponseRedirect(self.request.path)


class PjaxFormGetView(AjaxFormMixin, TemplateView):
	def get_context_data(self, **kwargs):
		ctx = super(PjaxFormGetView, self).get_context_data(**kwargs)
		ctx['form'] = MessagesForm(self.request.GET or None)
		return ctx


class MultiFormsView(multiforms.MultiFormsView):
	form_classes = {
		'form1': SimpleForm,
		'form2': SimpleForm,
		'form3': SimpleForm,
	}
	grouped_forms = {
		'group1': ['form2', 'form3']
	}

	def forms_valid(self, forms):
		if not self.only_validate_form:
			return HttpResponseRedirect(reverse('home'))
		return super(MultiFormsView, self).forms_valid(forms)

	def get_form1_initial(self):
		return {'text': 'initial'}


home_view = TemplateView.as_view(template_name='home.html')
utils_view = TemplateView.as_view(template_name='utils.html')
ajaxform_view = AjaxFormView.as_view(template_name='ajaxform.html')
messages_view = MessagesView.as_view(template_name='messages.html')
pjax_view = TemplateView.as_view(template_name='pjax.html')
pjax_messages_view = PjaxMessagesView.as_view(template_name='pjax_messages.html')
pjax_form_post_view = PjaxFormPostView.as_view(template_name='pjax_form_post.html')
pjax_form_get_view = PjaxFormGetView.as_view(template_name='pjax_form_get.html')
urlpatterns_view = TemplateView.as_view(template_name='urlpatterns.html')
form_utils_view = AjaxFormView.as_view(template_name='form_utils/base.html')
form_utils_foundation_view = AjaxFormView.as_view(template_name='form_utils/foundation.html')
formset_view = FormsetView.as_view(template_name='form_utils/formset.html')
multiforms_view = MultiFormsView.as_view(template_name='form_utils/multiforms.html')
