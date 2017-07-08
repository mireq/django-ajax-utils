# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.core.exceptions import SuspiciousOperation, ImproperlyConfigured
from django.http.response import HttpResponseRedirect
from django.views.generic.base import ContextMixin, TemplateResponseMixin
from django.views.generic.edit import ProcessFormView


class MultiFormMixin(ContextMixin):
	"""
	Dictionary of form classes, eg.

	{
		'login': LoginForm,
		'sugnup': SignupForm
	}
	"""
	form_classes = {}
	"""
	Process forms in groups, eg.

	{
		'address': ['shipping_address', 'invoicing_address']
	}
	"""
	grouped_forms = {}

	"""
	Custom prefixes for selected forms

	{
		'login': '', # no-prefix
		'signup': 'signup-',
	}
	"""
	prefixes = {}

	"""
	Allow only these actions:

	individual - submit individual forms with POST[action] = form name
	grouped - submit form groups with POST[action] = group name
	all - submit all forms without action parameter
	"""
	allow_partials = {'individual', 'grouped', 'all'}

	initial = {}
	success_url = None

	def get_form_classes(self):
		return self.form_classes

	def get_forms(self, form_classes, form_names):
		forms = {}
		for form_name, form_class in form_classes.items():
			bind = form_name in form_names
			forms[form_name] = self._create_form(form_name, form_class, bind)
		return forms

	def get_form_kwargs(self, form_name, bind_form=False):
		kwargs = {}
		kwargs.update({'initial':self.get_initial(form_name)})
		kwargs.update({'prefix':self.get_prefix(form_name)})

		if bind_form:
			kwargs.update(self._bind_form_data())

		form_kwargs_method = 'get_%s_form_kwargs' % form_name
		if hasattr(self, form_kwargs_method):
			kwargs.update(getattr(self, form_kwargs_method)())

		return kwargs

	def forms_valid(self, forms):
		for form_name, form_instance in forms.items():
			if form_instance.is_bound:
				form_valid_method = '%s_form_valid' % form_name
				if hasattr(self, form_valid_method):
					return getattr(self, form_valid_method)(form_instance)
		return HttpResponseRedirect(self.get_success_url())

	def forms_invalid(self, forms):
		return self.render_to_response(self.get_context_data(**forms))

	def get_initial(self, form_name):
		initial_method = 'get_%s_initial' % form_name
		if hasattr(self, initial_method):
			return getattr(self, initial_method)()
		else:
			return self.initial.copy()

	def get_prefix(self, form_name):
		return self.prefixes.get(form_name, form_name)

	def get_success_url(self):
		if self.success_url is None:
			raise ImproperlyConfigured("No success_url defined")
		return self.success_url

	def _create_form(self, form_name, cls, bind_form):
		form_kwargs = self.get_form_kwargs(form_name, bind_form)
		form_create_method = 'create_%s_form' % form_name
		if hasattr(self, form_create_method):
			form = getattr(self, form_create_method)(**form_kwargs)
		else:
			form = cls(**form_kwargs)
		return form

	def _bind_form_data(self):
		if self.request.method == 'POST':
			return {'data': self.request.POST, 'files': self.request.FILES}
		return {}


class ProcessMultiFormsMixin(ProcessFormView):
	def get(self, request, *args, **kwargs):
		form_classes = self.get_form_classes()
		forms = self.get_forms(form_classes, [])
		return self.render_to_response(self.get_context_data(**forms))

	def post(self, request, *args, **kwargs):
		form_classes = self.get_form_classes()
		form_names = self.get_form_names_for_action(self.get_action())
		forms = self.get_forms(form_classes, form_names)
		if all([forms[form_name].is_valid() for form_name in form_names]):
			return self.forms_valid(forms)
		else:
			return self.forms_invalid(forms)

	def get_action(self):
		return self.request.POST.get('action')

	def get_form_names_for_action(self, action):
		if not action:
			if 'all' in self.allow_partials:
				return self.form_classes.keys()
			else:
				raise SuspiciousOperation("Action not allowed")
		if 'grouped' in self.allow_partials:
			if action in self.grouped_forms:
				return self.grouped_forms[action]
		if 'individual' in self.allow_partials:
			if action in self.form_classes:
				return (action,)
		raise SuspiciousOperation("Action not allowed")


class BaseMultiFormsView(MultiFormMixin, ProcessMultiFormsMixin):
	pass


class MultiFormsView(TemplateResponseMixin, BaseMultiFormsView):
	pass
