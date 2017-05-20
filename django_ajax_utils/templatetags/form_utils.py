# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django import template


register = template.Library()


FORMROW_TEMPLATE_ATTRIBUTE = '_formrow_template'


class FormNode(template.Node):
	template_name = None

	def __init__(self, form_instance, template_name, nodelist):
		self.form = template.Variable(form_instance)
		self.nodelist = nodelist
		if template_name is not None:
			self.template_name = template.Variable(template_name)

	def render(self, context):
		context.push()
		try:
			form_instance = self.form.resolve(context)
			setattr(form_instance, FORMROW_TEMPLATE_ATTRIBUTE, 'form_utils/row/default.html')
			context['form_utils_form'] = form_instance
			if self.template_name is not None:
				template_name = self.template_name.resolve(context)
				t = context.template.engine.get_template(template_name)
				output = t.render(context)
			else:
				output = self.nodelist.render(context)
		finally:
			context.pop()
		return output


def form(parser, token):
	contents = token.split_contents()
	tag_name = contents[0]
	if len(contents) < 2:
		raise template.TemplateSyntaxError('%r tag requires form argument' % tag_name)
	if len(contents) > 4:
		raise template.TemplateSyntaxError('%r tag requires max 3 arguments' % tag_name)
	form_instance = contents[1]
	template_name = '"form_utils/layout/default.html"'
	nodelist = None
	if len(contents) > 2:
		if contents[2] != 'with':
			raise template.TemplateSyntaxError('%r tag\'s first argument should be with' % tag_name)
		if len(contents) == 3:
			nodelist = parser.parse(('end%s' % tag_name,))
			parser.delete_first_token()
		else:
			template_name = contents[3]
	return FormNode(form_instance, template_name, nodelist)


register.tag(form)


@register.simple_tag(takes_context=True)
def formrow_template(context, template_name):
	if not 'form_utils_form' in context:
		raise template.TemplateSyntaxError('This tag is allowed only inside template form tag')
	setattr(context['form_utils_form'], FORMROW_TEMPLATE_ATTRIBUTE, template_name)
	return ''


@register.simple_tag(takes_context=True)
def formrow(context, field, template_name=None):
	if not 'form_utils_form' in context:
		raise template.TemplateSyntaxError('This tag is allowed only inside template form tag')
	if template_name is None:
		template_name = getattr(context['form_utils_form'], FORMROW_TEMPLATE_ATTRIBUTE)
	context.push()
	try:
		context['field'] = field
		t = context.template.engine.get_template(template_name)
		output = t.render(context)
	finally:
		context.pop()
	return output
