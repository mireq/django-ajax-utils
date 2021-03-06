# -*- coding: utf-8 -*-
import json
import os
import re
import threading
import weakref

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http.response import HttpResponse
from django.template import TemplateDoesNotExist
from django.template.loaders.base import Loader as BaseLoader
from django.utils.encoding import force_str


_local = threading.local()
_pjax_cache = {'include': None, 'exclude': None}


def pjax_supported(request):
	pjax_supported = getattr(request, 'pjax_supported', None)
	if pjax_supported is not None:
		return pjax_supported
	if _pjax_cache['include'] is None:
		_pjax_cache['include'] = [
			re.compile(pattern) for pattern in getattr(settings, 'PJAX_INCLUDE_URLPATTERNS', [])
		]
	if _pjax_cache['exclude'] is None:
		_pjax_cache['exclude'] = [
			re.compile(pattern) for pattern in getattr(settings, 'PJAX_EXCLUDE_URLPATTERNS', [])
		]
	if request.resolver_match is None:
		return False
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
	pjax_supported = is_included and not is_excluded
	setattr(request, 'pjax_supported', pjax_supported)
	return getattr(request, 'pjax_supported')


def is_pjax_request(request):
	if not request:
		return False
	return request.META.get('HTTP_X_REQUESTED_WITH') == 'PJAXRequest'


def is_pjax(request):
	return is_pjax_request(request) and pjax_supported(request)


class Middleware(object):
	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		_local.request = request
		setattr(request, '_pjax_holders', {})
		response = self.get_response(request)
		if is_pjax(request):
			if response.status_code == 200:
				if not response.get('Content-Type', '').startswith('text/html'):
					return response
				pjax_holders = getattr(request, '_pjax_holders', {})
				blocks = {}
				for block_name, content in pjax_holders.items():
					blocks[block_name] = ''.join(content)

				json_data = {
					'is_pjax': True,
					'content': force_str(response.getvalue()),
					'blocks': blocks,
				}
				response = HttpResponse(json.dumps(json_data).encode('utf-8'), content_type="application/json")

		if is_pjax_request(request):
			if response.status_code in (301, 302):
				json_data = {
					'is_pjax': True,
					'plain_redirect': not pjax_supported(request),
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

	def get_template_sources(self, template_name, *args, **kwargs):
		sources = []
		if is_pjax(getattr(_local, 'request', None)):
			pjax_template = self.pjax_template_name(template_name)
			for template_loader in self.other_template_loaders:
				sources += template_loader.get_template_sources(pjax_template, *args, **kwargs)
		for template_loader in self.other_template_loaders:
			sources += template_loader.get_template_sources(template_name, *args, **kwargs)
		return sources

	def get_contents(self, origin):
		return origin.loader.get_contents(origin)

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


try:
	from jinja2 import nodes
	from jinja2.ext import Extension
	import jinja2
	import jinja2.exceptions


	class Environment(jinja2.Environment):
		def pjax_template_name(self, template_name):
			return '_pjax'.join(os.path.splitext(template_name))

		def _load_template(self, name, globals): # pylint: disable=redefined-builtin
			if self.loader is None:
				raise TypeError("no loader for this environment specified")
			cache_key = (weakref.ref(self.loader), name)
			if self.cache is not None:
				template = self.cache.get(cache_key)
				if template is not None and (not self.auto_reload or template.is_up_to_date):
					if template == '':
						raise jinja2.exceptions.TemplateNotFound(name)
					return template
			try:
				template = self.loader.load(self, name, globals)
			except jinja2.exceptions.TemplateNotFound:
				if self.cache is not None and not self.auto_reload:
					self.cache[cache_key] = ''
				raise

			if self.cache is not None:
				self.cache[cache_key] = template
			return template

		def check_pjax(self, name, request): # pylint: disable=unused-argument
			return is_pjax(request)

		def get_template(self, name, *args, **kwargs):
			if self.check_pjax(name, getattr(_local, 'request', None)):
				try:
					return super().get_template(self.pjax_template_name(name), *args, **kwargs)
				except jinja2.exceptions.TemplateNotFound:
					return super().get_template(name, *args, **kwargs)
			else:
				return super().get_template(name, *args, **kwargs)


	class PjaxBlockExtension(Extension):
		tags = set(['pjaxblock'])

		def parse(self, parser):
			lineno = next(parser.stream).lineno
			namearg = parser.parse_expression()
			if isinstance(namearg, nodes.Name):
				namearg = nodes.Const(namearg.name)
			ctx_ref = jinja2.nodes.ContextReference()
			args = [ctx_ref, namearg]
			body = parser.parse_statements(['name:endpjaxblock'], drop_needle=True)
			return nodes.CallBlock(self.call_method('_process', args), [], [], body).set_lineno(lineno)

		def _process(self, context, name, caller):
			output = caller()
			if not 'request' in context:
				return output
			request = context['request']
			if is_pjax(request):
				if not hasattr(request, '_pjax_holders'):
					raise ImproperlyConfigured("Middleware django_ajax_utils.pjax.Middleware not enabled")
				request._pjax_holders.setdefault(name, [])
				request._pjax_holders[name].append(output)
				return ''
			return output


except ImportError:
	pass
