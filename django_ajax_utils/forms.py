# -*- coding: utf-8 -*-
from django.forms import CheckboxInput
from django.utils.encoding import force_str

from .settings import FORMUTILS_ROW_TEMPLATE_ATTRIBUTE


class AutoPlaceholderFormMixin(object):
	"""
	Adds placeholder attributes to form inputs.
	"""

	def __init__(self, *args, **kwargs):
		super(AutoPlaceholderFormMixin, self).__init__(*args, **kwargs)
		for field in self.fields.values():
			if not 'placeholder' in field.widget.attrs and field.label:
				placeholder = field.help_text or field.label
				label = force_str(field.label)
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
		tags = set(['form', 'formrow', 'formrow_template'])

		def parse(self, parser):
			tag = next(parser.stream)
			if tag.value == 'form':
				return self.parse_form(parser, tag)
			elif tag.value == 'formrow':
				return self.parse_formrow(parser, tag)
			elif tag.value == 'formrow_template':
				return self.parse_formrow_template(parser, tag)

		def parse_form(self, parser, tag):
			lineno = tag.lineno
			form_instance = parser.parse_expression()
			template_name = nodes.Call(
				nodes.Name('get_formlayout_template', 'load'),
				[],
				[
					nodes.Keyword('caller_template', nodes.Const(parser.name)),
					nodes.Keyword('form', form_instance),
				],
				None,
				None,
			)
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
			return node.set_lineno(lineno)

		def parse_formrow(self, parser, tag):
			lineno = tag.lineno
			field = parser.parse_expression()
			template_name = None
			if not parser.stream.current.test('block_end'):
				template_name = parser.parse_expression()
			else:
				template_name = nodes.Call(
					nodes.Name('get_formrow_template', 'load'),
					[],
					[
						nodes.Keyword('caller_template', nodes.Const(parser.name)),
						nodes.Keyword('form', nodes.Name('form_utils_form', 'load'))
					],
					None,
					None,
				)
			if not parser.stream.current.test('block_end'):
				raise TemplateSyntaxError("Too many arguments", lineno)

			node = nodes.Scope(lineno=lineno)
			assignments = [
				nodes.Assign(nodes.Name('field', 'store'), field)
			]
			node.body = assignments + [nodes.Include(template_name, True, False)]
			return node.set_lineno(lineno)

		def parse_formrow_template(self, parser, tag):
			lineno = tag.lineno
			template_name = parser.parse_expression()
			if not parser.stream.current.test('block_end'):
				raise TemplateSyntaxError("Too many arguments", lineno)
			call = self.call_method('_process', [template_name, nodes.Name('form_utils_form', 'load', lineno=lineno)])
			return nodes.Output([nodes.MarkSafe(call)]).set_lineno(lineno)

		def _process(self, template_name, form_instance):
			setattr(form_instance, FORMUTILS_ROW_TEMPLATE_ATTRIBUTE, template_name)
			return ''


except ImportError:
	pass
