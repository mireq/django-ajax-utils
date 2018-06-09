# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.forms import CheckboxInput
from django.utils.encoding import force_text


class AutoPlaceholderFormMixin(object):
	"""
	Adds placeholder attributes to form inputs.
	"""

	def __init__(self, *args, **kwargs):
		super(AutoPlaceholderFormMixin, self).__init__(*args, **kwargs)
		for field in self.fields.values():
			if not 'placeholder' in field.widget.attrs and field.label:
				placeholder = field.help_text or field.label
				label = force_text(field.label)
				if not hasattr(label, '__html__') and not isinstance(field.widget, CheckboxInput):
					field.widget.attrs['placeholder'] = placeholder


class SetRequiredFieldsMixin(object):
	"""
	Overrides required attribute for selected fields.

	Example

	class Foo(SetRequiredFieldsMixin, forms.ModelForm):
		required_fields = {
			'field1': True,
			'field2': False,
		}
	"""

	required_fields = {}

	def __init__(self, *args, **kwargs):
		super(SetRequiredFieldsMixin, self).__init__(*args, **kwargs)
		for fieldname, is_required in self.required_fields.items():
			self.set_field_required(fieldname, is_required)

	def set_field_required(self, fieldname, is_required):
		self.fields[fieldname].required = is_required


class SetWidgetAttrsMixin(object):
	"""
	Overrides widget attributes.

	Example

	class Foo(SetWidgetAttrsMixin, forms.ModelForm):
		widget_attrs = {
			'field1': {'maxlength': '10'},
		}
	"""

	widget_attrs = {}

	def __init__(self, *args, **kwargs):
		super(SetWidgetAttrsMixin, self).__init__(*args, **kwargs)
		for fieldname, attrs in self.widget_attrs.items():
			if fieldname in self.fields:
				self.fields[fieldname].widget.attrs.update(attrs)


try:
	from jinja2 import nodes
	from jinja2.ext import Extension
	from jinja2.exceptions import TemplateSyntaxError


	class FormExtension(Extension):
		tags = set(['form', 'formrow'])

		def parse(self, parser):
			tag = next(parser.stream)
			if tag.value == 'form':
				return self.parse_form(parser, tag)
			elif tag.value == 'formrow':
				return self.parse_formrow(parser, tag)

		def parse_form(self, parser, tag):
			lineno = tag.lineno
			form_instance = parser.parse_expression()
			template_name = nodes.Const('form_utils/layout/default.jinja')
			has_body = False
			if not parser.stream.current.test('block_end'):
				parser.stream.expect('name:using')
				if parser.stream.current.test('block_end'):
					has_body = True
			if not parser.stream.current.test('block_end'):
				template_name = parser.parse_expression()
			if not parser.stream.current.test('block_end'):
				raise TemplateSyntaxError("Too many arguments", lineno)

			body = None
			if has_body:
				body = parser.parse_statements(['name:endform'], drop_needle=True)
			else:
				body = nodes.Include(template_name, True, False)
				body = [body]

			node = nodes.Scope(lineno=lineno)
			assignments = [
				nodes.Assign(nodes.Name('form_utils_form', 'store'), form_instance)
			]
			node.body = assignments + body
			return node

		def parse_formrow(self, parser, tag):
			lineno = tag.lineno
			field = parser.parse_expression()
			template_name = None
			if not parser.stream.current.test('block_end'):
				template_name = parser.parse_expression()
			else:
				template_name = nodes.Getattr(nodes.Name('form_utils_form', 'store'), '_formrow_template', 'load')
			if not parser.stream.current.test('block_end'):
				raise TemplateSyntaxError("Too many arguments", lineno)

			node = nodes.Scope(lineno=lineno)
			assignments = [
				nodes.Assign(nodes.Name('field', 'store'), field)
			]
			node.body = assignments + [nodes.Include(template_name, True, False)]
			return node
except ImportError:
	pass
