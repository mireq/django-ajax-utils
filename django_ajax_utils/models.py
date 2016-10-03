# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.utils import six
from django.utils.translation import ugettext_lazy as _


class JSONField(models.TextField):
	description = _("JSON data")

	def from_db_value(self, value, *args, **kwargs):
		if not value:
			return None
		try:
			return json.loads(value)
		except ValueError:
			pass

	def to_python(self, value):
		if isinstance(value, six.string_types):
			return json.loads(value)
		else:
			return value

	def get_prep_value(self, value):
		if value == '':
			return ''
		if not isinstance(value, six.string_types):
			value = json.dumps(value, cls=DjangoJSONEncoder, sort_keys=True)
		return value
