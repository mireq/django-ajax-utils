# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json

import six
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models


class JSONField(models.TextField):
	def from_db_value(self, value, *args, **kwargs):
		if value == '':
			return None

		try:
			return json.loads(value)
		except ValueError:
			pass

	def get_db_prep_save(self, value, connection, **kwargs):
		if value == '':
			return None

		if not isinstance(value, six.string_types):
			value = json.dumps(value, cls=DjangoJSONEncoder, sort_keys=True)

		return super(JSONField, self).get_db_prep_save(value, connection=connection, **kwargs)

