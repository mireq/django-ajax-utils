# -*- coding: utf-8 -*-
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


def check_ajax(request):
	"""
	Returns True if request is from ajax call
	"""
	return request.is_ajax()
