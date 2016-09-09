# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.forms import CheckboxInput
from django.utils.safestring import SafeText


class AutoPlaceholderFormMixin(object):
	"""
	Adds placeholder attributes to form inputs.
	"""

	def __init__(self, *args, **kwargs):
		super(AutoPlaceholderFormMixin, self).__init__(*args, **kwargs)
		for field in self.fields.values():
			if not 'placeholder' in field.widget.attrs and field.label:
				placeholder = field.help_text or field.label
				if not isinstance(field.label, SafeText) and not isinstance(placeholder, CheckboxInput):
					field.widget.attrs['placeholder'] = placeholder
