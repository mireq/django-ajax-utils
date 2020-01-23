# -*- coding: utf-8 -*-
import json
import xml.sax
from io import BytesIO, StringIO

from django.utils.encoding import force_bytes


encoder = json.JSONEncoder()


class CompilerHandler(xml.sax.ContentHandler):
	INDENT = '\t'

	def __init__(self, *args, **kwargs):
		super(CompilerHandler, self).__init__(*args, **kwargs)
		self.output = StringIO()
		self.depth = -1
		self.lastDepth = -2
		self.textContent = None

	def startElement(self, name, attrs):
		self.object_start()
		if name[0] == ':':
			self.write_indent()
			self.output.write('E(' + encoder.encode('#text=' + name[1:]) + ', ')
			self.textContent = ''
		else:
			name = name.replace(':', '=')
			self.write_indent()
			self.output.write('E(' + encoder.encode(name) + ', [')
			for name, value in attrs.items():
				name = name.replace(':', '=')
				self.object_start()
				self.write_indent()
				self.output.write('E(' + encoder.encode('@' + name) + ', ' + encoder.encode(value) + ')')
				self.object_end()

	def endElement(self, name):
		if self.textContent is not None:
			self.output.write(encoder.encode(self.textContent))
			self.textContent = None
		if name[0] == ':':
			self.output.write(')')
		else:
			self.output.write('\n')
			self.write_indent()
			self.output.write('])')
		self.object_end()

	def characters(self, content):
		if not content.strip():
			return
		if self.textContent is not None:
			self.textContent += content
		else:
			self.object_start()
			self.write_indent()
			self.output.write('E("#text", ' + encoder.encode(content) + ')')
			self.object_end()

	def object_start(self):
		if self.lastDepth == self.depth:
			self.output.write(',')
		self.output.write('\n')
		self.lastDepth = self.depth
		self.depth += 1

	def object_end(self):
		self.depth -= 1
		self.lastDepth = self.depth

	def write_indent(self):
		self.output.write(self.INDENT * self.depth)

	def get_output(self):
		return self.output.getvalue()


def compile(source):
	handler = CompilerHandler()
	parser = xml.sax.make_parser()
	parser.setContentHandler(handler)
	parser.setErrorHandler(xml.sax.ErrorHandler())
	parser.parse(BytesIO(force_bytes(source)))
	return handler.get_output()
