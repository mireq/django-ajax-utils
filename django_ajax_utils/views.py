# -*- coding: utf-8 -*-
import json

from django import forms
from django.http import JsonResponse
from django.http.response import HttpResponseRedirect

from .utility import check_ajax


class JsonResponseMixin(object):
	"""
	Mixin that handles JSON serialization.
	"""

	def render_json_response(self, data, **kwargs):
		"""
		Renders data as JSON into HttpResponse.
		"""
		kwargs.setdefault('safe', False)
		return JsonResponse(data, **kwargs)


class AjaxRedirectMixin(JsonResponseMixin):
	"""
	Mixin that transforms HttpResponseRedirect to JSON response
	{"redirect": "url"} for ajax calls.
	"""

	def dispatch(self, request, *args, **kwargs):
		response = super().dispatch(request, *args, **kwargs)
		if check_ajax(request):
			if isinstance(response, HttpResponseRedirect):
				original_response = response
				url = original_response.url
				response = self.render_json_response({"redirect": url})
				response.cookies = original_response.cookies
		return response


class AjaxFormMixin(AjaxRedirectMixin, JsonResponseMixin):
	only_validate_field = 'only_validate'

	@property
	def only_validate_form(self):
		return bool(self.request.POST.get(self.only_validate_field, False))

	def post(self, request, *args, **kwargs):
		if check_ajax(request):
			response = super().post(request, *args, **kwargs)
			if hasattr(response, 'context_data'):
				return self.format_forms_status(response)
			else:
				return response
		else:
			return super().post(request, *args, **kwargs)

	def form_valid(self, form):
		if self.only_validate_form:
			return self.render_to_response(self.get_context_data(form=form))
		return super().form_valid(form)

	def format_forms_status(self, response, status_code=200):
		ctx = response.context_data
		json_response = {'forms': {}}
		for key, form in ctx.items():
			if isinstance(form, (forms.BaseForm, forms.BaseFormSet)) and form.is_bound:
				json_response['forms'][key] = self.format_form_status(form)
		return self.render_json_response(json_response, status=status_code)

	def format_form_status(self, form):
		form_data = {
			'status': 'valid' if form.is_valid() else 'invalid',
			'errors': {},
			'valid': [],
			'empty': [],
		}

		def add_formset_status(formset):
			for formrow in formset:
				if formset.can_delete and formset._should_delete_form(formrow):
					for name, __ in formrow.fields.items():
						form_data['empty'].append(formrow.add_prefix(name))
				else:
					status = self.format_form_status(formrow)
					form_data['errors'].update(status['errors'])
					form_data['valid'] += status['valid']

		if not form.is_valid():
			if hasattr(form, 'non_form_errors'):
				errors = json.loads(form.non_form_errors().as_json())
				if errors:
					form_data['errors']['__all__'] = errors
			if isinstance(form, forms.BaseFormSet):
				add_formset_status(form)
				return form_data
			else:
				for field, errors in form.errors.items():
					fieldname = form.add_prefix(field)
					form_data['errors'][fieldname] = json.loads(errors.as_json())

		if isinstance(form, forms.BaseFormSet):
			add_formset_status(form)
		else:
			form_data.update(self.__format_fields_status(form, form_data))
		return form_data

	def __format_fields_status(self, form, form_data):
		valid = []
		empty = []
		if hasattr(form, 'cleaned_data'):
			for name, field in form.fields.items():
				fieldname = form.add_prefix(name)
				if field.widget.value_from_datadict(form.data, form.files, form.add_prefix(name)) in field.empty_values:
					empty.append(fieldname)
				if fieldname in form_data['errors'] or not name in form.cleaned_data or form.cleaned_data[name] in field.empty_values:
					continue
				valid.append(fieldname)
		return {
			'valid': valid,
			'empty': empty,
		}
