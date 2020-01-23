# -*- coding: utf-8 -*-
from django import template
from django.core.exceptions import ImproperlyConfigured
from django_ajax_utils.pjax import is_pjax


register = template.Library()


class PjaxBlockNode(template.Node):
	def __init__(self, block_name, nodelist):
		self.block_name = block_name
		self.nodelist = nodelist

	def render(self, context):
		output = self.nodelist.render(context)
		if not 'request' in context:
			return output
		request = context['request']
		if is_pjax(request):
			if not hasattr(request, '_pjax_holders'):
				raise ImproperlyConfigured("Middleware django_ajax_utils.pjax.Middleware not enabled")
			request._pjax_holders.setdefault(self.block_name, [])
			request._pjax_holders[self.block_name].append(output)
			return ''
		return output


@register.tag
def pjaxblock(parser, token):
	try:
		tag_name, block_name = token.split_contents()
	except ValueError:
		raise template.TemplateSyntaxError("%r tag requires exactly two arguments" % token.contents.split()[0])
	nodelist = parser.parse(('end' + tag_name,))
	parser.delete_first_token()
	return PjaxBlockNode(block_name, nodelist)
