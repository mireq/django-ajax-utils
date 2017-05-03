# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from .settings import DUMMY_PARAMETER_NAMES


class RemoveDummyParametersMiddleware(object):
	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		request.GET._mutable = True
		for param in DUMMY_PARAMETER_NAMES:
			request.GET.pop(param, None)
		request.GET._mutable = False
		return self.get_response(request)
