# -*- coding: utf-8 -*-
import os
from collections import namedtuple
from dataclasses import dataclass, field
from typing import Optional, Union


def template_name_add_suffix(template_name, suffix):
	"""
	Add suffix to template name. Example

	template_name = "home.html", suffix = "ajax" -> returns "home_ajax.html"
	"""
	return suffix.join(os.path.splitext(template_name))


def template_names_add_suffix(template_names, suffix):
	"""
	Add suffix to each template name from list template_names
	"""
	if isinstance(template_names, str):
		template_names  = (template_names,)
	return tuple(template_name_add_suffix(tpl, suffix) for tpl in template_names)


def get_accept_parser(request):
	"""
	Returns AcceptParser for request
	"""
	if not hasattr(request, 'accept_parser'):
		request.accept_parser = AcceptParser(request.META.get('HTTP_ACCEPT'))
	return request.accept_parser


JSON_SUPPORTED_TYPES = ['application/json', 'application/pjax.json']


def check_json(request):
	"""
	Returns True if request is from ajax call
	"""
	mimetype = get_accept_parser(request).negotiate(JSON_SUPPORTED_TYPES, wildcard=False)
	return bool(mimetype)


MimeType = namedtuple('MimeType', ['content_type', 'content_subtype'])


@dataclass
class ContentType(object):
	content_type: str = '*'
	content_subtype: str = '*'
	quality: float = 1.0
	parameters: dict = field(default_factory=dict)

	def __repr__(self):
		return f'{self.content_type}/{self.content_subtype}; q={self.quality}' + ''.join(f'; {key}=val' for key, val in self.parameters.items())

	@staticmethod
	def parse(accept: str) -> 'ContentType':
		params = [part.strip() for part in accept.split(';') if part.strip()]
		if not params:
			return ContentType()
		q = 1.0
		content_type, params = params[0], params[1:]
		try:
			content_type, content_subtype = content_type.split('/', 1)
		except ValueError:
			content_subtype = '*'
		parameters = {}
		for param in params:
			try:
				param, value = param.split('=', 1)
			except ValueError:
				value = ''
			param = param.lower()
			if param == 'q':
				try:
					q = float(value)
				except ValueError:
					q = 1.0
			else:
				parameters[param] = value
		return ContentType(content_type, content_subtype, q, parameters)

	def matches(self, other: 'ContentType', wildcard: bool = True) -> bool:
		if not wildcard:
			return self.content_type == other.content_type and self.content_subtype == other.content_subtype
		if self.content_type != '*' and other.content_type != '*' and self.content_type != other.content_type:
			return False
		if self.content_subtype != '*' and other.content_subtype != '*' and self.content_subtype != other.content_subtype:
			return False
		if self.parameters and other.parameters and self.parameters != other.parameters:
			return False
		return True

	@property
	def full_type(self):
		return f'{self.content_type}/{self.content_subtype}'


class AcceptParser(object):
	__slots__ = ['__content_types', '__mimetypes', 'main_mimetype']

	def __init__(self, accept):
		if accept:
			self.__content_types = [ContentType.parse(part.strip()) for part in accept.split(',') if part.strip()]
		else:
			self.__content_types = []
		self.__content_types = sorted(self.__content_types, key=lambda ct: -ct.quality)
		self.__mimetypes = set(f'{ct.content_type}/{ct.content_subtype}' for ct in self.__content_types)

		if self.__content_types:
			main_content_type = self.__content_types[0]
			self.main_mimetype = f'{main_content_type.content_type}/{main_content_type.content_subtype}'
		else:
			self.main_mimetype = ''

	def __repr__(self):
		return ', '.join(repr(content_type) for content_type in self.__content_types)

	def __split_content_type(self, content_type: str) -> MimeType:
		try:
			content_type, content_subtype = content_type.split('/', 1)
		except ValueError:
			content_subtype = '*'
		return MimeType(content_type, content_subtype)

	def __query_to_content_type(self, query: list) -> list:
		choices = []
		for choice in query:
			if isinstance(choice, ContentType):
				choices.append(choice)
			elif isinstance(choice, str):
				choices.append(ContentType(*self.__split_content_type(choice)))
			elif isinstance(choice, (list, tuple)):
				mtype = self.__split_content_type(choice[0])
				choices.append(ContentType(mtype.content_type, mtype.content_subtype, 1.0, choice[1]))
			else:
				raise ValueError("Not supported choice type")
		return choices

	def negotiate(self, query: Union[list, str], wildcard: bool = True) -> Optional[ContentType]:
		"""
		Find best matching content type
		"""
		if isinstance(query, str):
			query = [query]
		query = self.__query_to_content_type(query)
		for content_type in self.__content_types:
			for choice in query:
				if content_type.matches(choice, wildcard):
					return content_type

	def has_content_type(self, content_type: str) -> bool:
		"""
		Simple check if content type is defined in accept. This will not match
		mime type wildcards.
		"""
		return content_type in self.__mimetypes
