# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import threading

from django.template import TemplateDoesNotExist
from django.template.loaders.base import Loader as BaseLoader


_local = threading.local()


class Middleware(object):
	def process_request(self, request):
		_local.request = request


class Loader(BaseLoader):
	@property
	def other_template_loaders(self):
		for template_loader in self.engine.template_loaders:
			if template_loader != self:
				yield template_loader

	def pjax_template_name(self, template_name):
		return '_pjax'.join(os.path.splitext(template_name))

	def is_pjax(self, request):
		if not request:
			return False
		return request.is_ajax()

	def load_template_source(self, template_name, template_dirs=None):
		if self.is_pjax(getattr(_local, 'request', None)):
			try:
				return self.direct_load_template(self.ajax_template_name(template_name), template_dirs)
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
