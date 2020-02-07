# -*- coding: utf-8 -*-
import json

from django import template, urls
from django.utils.encoding import force_str
from django.utils.safestring import mark_safe


register = template.Library()
url_resolver = urls.get_resolver()


def prepare_url_list(resolver, namespace_path='', namespace=''):
	for url_name in resolver.reverse_dict.keys():
		if not isinstance(url_name, str):
			continue
		url_name = force_str(url_name)
		formated_patterns = []
		for url_pattern in resolver.reverse_dict.getlist(url_name):
			for url_format, url_params in url_pattern[0]:
				formated_patterns.append({'pattern': namespace_path + url_format, 'params': url_params})
		yield {'name': namespace + url_name, 'patterns': formated_patterns}

	for inner_ns, (inner_ns_path, inner_resolver) in resolver.namespace_dict.items():
		inner_ns_path = namespace_path + inner_ns_path
		inner_ns = namespace + inner_ns + ':'

		if inner_ns_path:
			inner_resolver = urls.get_ns_resolver(inner_ns_path, inner_resolver, ())
			inner_ns_path = ''

		for url_pattern in prepare_url_list(inner_resolver, inner_ns_path, inner_ns):
			yield url_pattern


def safe_json_str(json_str):
	# from https://gist.github.com/amacneil/5af7cd0e934f5465b695
	unsafe_chars = {
		'&': '\\u0026',
		'<': '\\u003c',
		'>': '\\u003e',
		'\u2028': '\\u2028',
		'\u2029': '\\u2029'
	}
	for (c, d) in unsafe_chars.items():
		json_str = json_str.replace(c, d)
	return mark_safe(json_str)


@register.simple_tag
def js_urlpatterns(*export_patterns):
	if len(export_patterns) == 1 and isinstance(export_patterns[0], (list, tuple)):
		export_patterns = export_patterns[0]
	export_patterns = frozenset(export_patterns)
	if export_patterns in js_urlpatterns.cache:
		return js_urlpatterns.cache[export_patterns]
	if export_patterns:
		url_patterns = {pattern['name']: pattern['patterns'] for pattern in prepare_url_list(url_resolver) if pattern['name'] in export_patterns}
	else:
		url_patterns = {pattern['name']: pattern['patterns'] for pattern in prepare_url_list(url_resolver)}
	js_urlpatterns.cache[export_patterns] = safe_json_str(json.dumps(url_patterns))
	return js_urlpatterns.cache[export_patterns]
js_urlpatterns.cache = {}


try:
	from django_jinja import library

	library.global_function(js_urlpatterns)
except ImportError:
	pass
