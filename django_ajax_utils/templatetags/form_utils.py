# -*- coding: utf-8 -*-
import types
from importlib import import_module

from django import forms, template

from ..settings import FORMUTILS_ROW_TEMPLATE_ATTRIBUTE, FORMUTILS_DEFAULT_LAYOUT_TEMPLATE, FORMUTILS_DEFAULT_ROW_TEMPLATE, FORMUTILS_DEFAULT_ROW_TEMPLATE_GET, FORMUTILS_DEFAULT_LAYOUT_TEMPLATE_GET


register = template.Library()


class FormNode(template.Node):
	template_name = None

	def __init__(self, form_instance, template_name, nodelist):
		self.form = template.Variable(form_instance)
		self.empty_nodelist = nodelist is None
		self.nodelist = nodelist or []
		if template_name is not None:
			self.template_name = template.Variable(template_name)

	def render(self, context):
		context.push()
		try:
			form_instance = self.form.resolve(context)
			setattr(form_instance, FORMUTILS_ROW_TEMPLATE_ATTRIBUTE, 'form_utils/row/default.html')
			context['form_utils_form'] = form_instance
			context['form'] = form_instance
			if self.empty_nodelist:
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
		if contents[2] != 'using':
			raise template.TemplateSyntaxError('%r tag\'s first argument should be using' % tag_name)
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
	setattr(context['form_utils_form'], FORMUTILS_ROW_TEMPLATE_ATTRIBUTE, template_name)
	return ''


@register.simple_tag(takes_context=True)
def formrow(context, field, template_name=None):
	if not 'form_utils_form' in context:
		raise template.TemplateSyntaxError('This tag is allowed only inside template form tag')
	if not isinstance(field, (forms.Field, forms.BoundField)):
		return ''
	if template_name is None:
		template_name = getattr(context['form_utils_form'], FORMUTILS_ROW_TEMPLATE_ATTRIBUTE)
	context.push()
	try:
		context['field'] = field
		t = context.template.engine.get_template(template_name)
		output = t.render(context)
	finally:
		context.pop()
	return output


FORMUTILS_DEFAULT_LAYOUT_TEMPLATE = 'form_utils/layout/default.jinja' if FORMUTILS_DEFAULT_LAYOUT_TEMPLATE is None else FORMUTILS_DEFAULT_LAYOUT_TEMPLATE
FORMUTILS_DEFAULT_ROW_TEMPLATE = 'form_utils/row/default.jinja' if FORMUTILS_DEFAULT_ROW_TEMPLATE is None else FORMUTILS_DEFAULT_ROW_TEMPLATE


def import_name(path):
	module_name, obj_name = path.rsplit('.', 1)
	module = import_module(module_name)
	return getattr(module, obj_name)


if FORMUTILS_DEFAULT_LAYOUT_TEMPLATE_GET is None:
	def get_formlayout_template(form, caller_template, **kwargs): # pylint: disable=unused-argument
		return FORMUTILS_DEFAULT_LAYOUT_TEMPLATE
else:
	get_formlayout_template = import_name(FORMUTILS_DEFAULT_LAYOUT_TEMPLATE_GET)


if FORMUTILS_DEFAULT_ROW_TEMPLATE_GET is None:
	def get_formrow_template(form, caller_template, **kwargs): # pylint: disable=unused-argument
		return getattr(form, FORMUTILS_ROW_TEMPLATE_ATTRIBUTE, FORMUTILS_DEFAULT_ROW_TEMPLATE)
else:
	get_formrow_template = import_name(FORMUTILS_DEFAULT_ROW_TEMPLATE_GET)


jinja_get_formlayout_template = get_formlayout_template
jinja_get_formrow_template = get_formrow_template


@register.filter
def add_field_class(field, cls):
	as_widget_copy = field.as_widget

	def as_widget(self, widget=None, attrs=None, *args, **kwargs):
		if not widget:
			widget = self.field.widget
		attrs = attrs or widget.attrs.copy()
		attrs.setdefault('class', '')
		attrs['class'] += ' ' + cls
		output = as_widget_copy(widget, attrs, *args, **kwargs)
		self.as_widget = as_widget_copy
		return output

	field.as_widget = types.MethodType(as_widget, field)
	return field


@register.filter
def is_checkbox(field):
	return isinstance(field.field.widget, forms.CheckboxInput)


@register.filter
def is_select(field):
	return isinstance(field.field.widget, forms.Select)


@register.filter
def is_radio(field):
	return isinstance(field.field.widget, forms.RadioSelect)


@register.filter
def is_multiple(field):
	return isinstance(field.field, forms.MultipleChoiceField)


try:
	from django_jinja import library

	#library.global_function(contextfunction(formrow_template))
	library.global_function(fn=jinja_get_formlayout_template, name='get_formlayout_template')
	library.global_function(fn=jinja_get_formrow_template, name='get_formrow_template')
	library.filter(add_field_class)
	library.filter(is_checkbox)
	library.filter(is_select)
	library.filter(is_radio)
	library.filter(is_multiple)
except ImportError:
	pass
