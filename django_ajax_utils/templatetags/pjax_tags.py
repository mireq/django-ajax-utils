# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django import template

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
		if is_pjax(context['request']):
			context['PJAX_HOLDERS'].setdefault(self.block_name, [])
			context['PJAX_HOLDERS'][self.block_name].append(output)
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
