# -*- coding: utf-8 -*-
import types

from django.utils.encoding import escape_uri_path

from .settings import DUMMY_PARAMETER_NAMES


def get_clean_path(self):
	if hasattr(self, '_clean_path'):
		return getattr(self, '_clean_path')
	get = self.GET.copy()
	for param in DUMMY_PARAMETER_NAMES:
		get.pop(param, None)
	clean_path = '%s%s' % (
		escape_uri_path(self.path),
		('?' + get.urlencode() if get else '')
	)
	return clean_path


class RemoveDummyParametersMiddleware(object):
	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		request = self.process_request(request) or request
		return self.get_response(request)

	def process_request(self, request):
		request.GET._mutable = True
		for param in DUMMY_PARAMETER_NAMES:
			request.GET.pop(param, None)
		request.GET._mutable = False
		request.get_clean_path = types.MethodType(get_clean_path, request)
