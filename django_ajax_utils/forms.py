# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.forms import CheckboxInput
from django.utils.encoding import force_text


class AutoPlaceholderFormMixin(object):
	"""
	Adds placeholder attributes to form inputs.
	"""

	def __init__(self, *args, **kwargs):
		super(AutoPlaceholderFormMixin, self).__init__(*args, **kwargs)
		for field in self.fields.values():
			if not 'placeholder' in field.widget.attrs and field.label:
				placeholder = field.help_text or field.label
				label = force_text(field.label)
				if not hasattr(label, '__html__') and not isinstance(field.widget, CheckboxInput):
					field.widget.attrs['placeholder'] = placeholder


class SetRequiredFieldsMixin(object):
	"""
	Overrides required attribute for selected fields.

	Example

	class Foo(SetRequiredFieldsMixin, forms.ModelForm):
		required_fields = {
			'field1': True,
			'field2': False,
		}
	"""

	required_fields = {}

	def __init__(self, *args, **kwargs):
		super(SetRequiredFieldsMixin, self).__init__(*args, **kwargs)
		for fieldname, is_required in self.required_fields.items():
			self.set_field_required(fieldname, is_required)

	def set_field_required(self, fieldname, is_required):
		self.fields[fieldname].required = is_required


class SetWidgetAttrsMixin(object):
	"""
	Overrides widget attributes.

	Example

	class Foo(SetRequiredFieldsMixin, forms.ModelForm):
		required_fields = {
			'field1': {'maxlength': '10'},
		}
	"""

	widget_attrs = {}

	def __init__(self, *args, **kwargs):
		super(SetWidgetAttrsMixin, self).__init__(*args, **kwargs)
		for fieldname, attrs in self.widget_attrs.items():
			if fieldname in self.fields:
				self.fields[fieldname].widget.attrs.update(attrs)
