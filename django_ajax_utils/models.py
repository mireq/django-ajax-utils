# -*- coding: utf-8 -*-
import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.utils.translation import gettext_lazy as _


class JSONField(models.TextField):
	description = _("JSON data")

	def from_db_value(self, value, *args, **kwargs):
		if value is None:
			return
		try:
			return json.loads(value)
		except ValueError:
			pass

	def to_python(self, value):
		if isinstance(value, str):
			return json.loads(value)
		return value

	def get_db_prep_value(self, value, connection=None, prepared=None):
		return self.get_prep_value(value)

	def get_prep_value(self, value):
		if value == '':
			return ''
		if value is None and self.null:
			return
		if not isinstance(value, str):
			return json.dumps(value, cls=DjangoJSONEncoder, sort_keys=True)
		return value

	def value_to_string(self, obj):
		value = self.value_from_object(obj)
		return self.get_prep_value(value)
