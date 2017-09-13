# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json

from django import forms
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from django.http.response import HttpResponseRedirect
from django.utils.encoding import force_bytes

from .utility import check_ajax


class JsonResponseMixin(object):
	"""
	Mixin that handles JSON serialization.
	"""

	def __serialize_json_data(self, data, encoder):
		return force_bytes(json.dumps(data, cls=encoder))

	def render_json_response(self, data, encoder=DjangoJSONEncoder, **kwargs):
		"""
		Renders data as JSON into HttpResponse.
		"""
		json_data = self.__serialize_json_data(data, encoder)
		return HttpResponse(json_data, content_type="application/json", **kwargs)


class AjaxRedirectMixin(JsonResponseMixin):
	"""
	Mixin that transforms HttpResponseRedirect to JSON response
	{"redirect": "url"} for ajax calls.
	"""

	def dispatch(self, request, *args, **kwargs):
		response = super(AjaxRedirectMixin, self).dispatch(request, *args, **kwargs)
		if check_ajax(request):
			if isinstance(response, HttpResponseRedirect):
				url = response.url
				response = self.render_json_response({"redirect": url})
		return response


class AjaxFormMixin(AjaxRedirectMixin, JsonResponseMixin):
	only_validate_field = 'only_validate'

	@property
	def only_validate_form(self):
		return bool(self.request.POST.get(self.only_validate_field, False))

	def post(self, request, *args, **kwargs):
		if check_ajax(request):
			response = super(AjaxFormMixin, self).post(request, *args, **kwargs)
			if hasattr(response, 'context_data'):
				return self.format_forms_status(response.context_data)
			else:
				return response
		else:
			return super(AjaxFormMixin, self).post(request, *args, **kwargs)

	def form_valid(self, form):
		if self.only_validate_form:
			return self.render_to_response(self.get_context_data(form=form))
		return super(AjaxFormMixin, self).form_valid(form)

	def format_forms_status(self, ctx, status_code=200):
		json_response = {'forms': {}}
		for key, form in ctx.items():
			if isinstance(form, (forms.BaseForm, forms.BaseFormSet)):
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
				status = self.format_form_status(formrow)
				form_data['errors'].update(status['errors'])
				form_data['valid'] += status['valid']

		if not form.is_valid():
			if hasattr(form, 'non_form_errors'):
				form_data['errors']['__all__'] = json.loads(form.non_form_errors().as_json())
			if isinstance(form, forms.BaseFormSet):
				add_formset_status(form)
				return form_data
			else:
				for field, errors in form.errors.items():
					if field in form.fields:
						fieldname = form[field].id_for_label
						form_data['errors'][fieldname] = json.loads(errors.as_json())
					else:
						form_data['errors'][field] = json.loads(errors.as_json())

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
				fieldname = form[name].id_for_label
				if field.widget.value_from_datadict(form.data, form.files, form.add_prefix(name)) in field.empty_values:
					empty.append(fieldname)
				if fieldname in form_data['errors'] or not name in form.cleaned_data or form.cleaned_data[name] in field.empty_values:
					continue
				valid.append(fieldname)
		return {
			'valid': valid,
			'empty': empty,
		}
