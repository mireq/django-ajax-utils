# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json
import os
import threading
from django.conf import settings

from django.http.response import HttpResponse
from django.template import TemplateDoesNotExist
from django.template.loaders.base import Loader as BaseLoader
from django.utils.encoding import force_text
import re


_local = threading.local()
_pjax_cache = {'include': None, 'exclude': None}


def pjax_supported(request):
	if _pjax_cache['include'] is None:
		_pjax_cache['include'] = [
			re.compile(pattern) for pattern in getattr(settings, 'PJAX_INCLUDE_URLPATTERNS', [])
		]
		_pjax_cache['exclude'] = [
			re.compile(pattern) for pattern in getattr(settings, 'PJAX_EXCLUDE_URLPATTERNS', [])
		]
	view_name = request.resolver_match.view_name
	is_included = False
	is_excluded = False
	for pattern in _pjax_cache['include']: # pylint: disable=not-an-iterable
		if pattern.match(view_name):
			is_included = True
			break
	for pattern in _pjax_cache['exclude']: # pylint: disable=not-an-iterable
		if pattern.match(view_name):
			is_excluded = True
			break
	return is_included and not is_excluded


def is_pjax(request):
	if not request:
		return False
	return request.META.get('HTTP_X_PJAX') == 'true' and pjax_supported(request)


class Middleware(object):
	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		_local.request = request
		setattr(request, '_pjax_holders', {})
		response = self.get_response(request)
		if is_pjax(request):
			if response.status_code == 200:
				pjax_holders = getattr(request, '_pjax_holders', {})
				blocks = {}
				for block_name, content in pjax_holders.items():
					blocks[block_name] = ''.join(content)

				json_data = {
					'is_pjax': True,
					'content': force_text(response.getvalue()),
					'blocks': blocks,
				}
				response = HttpResponse(json.dumps(json_data).encode('utf-8'), content_type="application/json")

			if response.status_code in (301, 302):
				json_data = {
					'is_pjax': True,
					'redirect': response.url,
				}
				response = HttpResponse(json.dumps(json_data).encode('utf-8'), content_type="application/json")

		return response


class Loader(BaseLoader):
	@property
	def other_template_loaders(self):
		for template_loader in self.engine.template_loaders:
			if template_loader != self:
				yield template_loader

	def pjax_template_name(self, template_name):
		return '_pjax'.join(os.path.splitext(template_name))

	def load_template_source(self, template_name, template_dirs=None):
		if is_pjax(getattr(_local, 'request', None)):
			try:
				return self.direct_load_template(self.pjax_template_name(template_name), template_dirs)
			except TemplateDoesNotExist:
				return self.direct_load_template(template_name, template_dirs)
		else:
			return self.direct_load_template(template_name, template_dirs)

	def direct_load_template(self, template_name, template_dirs):
		for template_loader in self.other_template_loaders:
			try:
				return template_loader.load_template_source(template_name, template_dirs)
			except TemplateDoesNotExist:
				pass
			except NotImplementedError:
				pass
			except AttributeError:
				pass
		raise TemplateDoesNotExist(template_name)

	def get_template_sources(self, *args, **kwargs):
		sources = []
		for template_loader in self.other_template_loaders:
			sources += template_loader.get_template_sources(*args, **kwargs)
		return sources
