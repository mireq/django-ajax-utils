# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django import forms
from django.contrib.messages import constants
from django.core import validators
from django.forms import formset_factory
from django.utils.translation import ugettext_lazy as _

from django_ajax_utils.forms import AutoPlaceholderFormMixin, SetWidgetAttrsMixin


# Hack for disable required html attribute
class TextInput(forms.TextInput):
	def use_required_attribute(self, initial):
		return False


class PasswordInput(forms.PasswordInput):
	def use_required_attribute(self, initial):
		return False


class SignupForm(AutoPlaceholderFormMixin, SetWidgetAttrsMixin, forms.Form):
	widget_attrs = {
		'username': {'maxlength': 10},
	}

	username = forms.CharField(label=_("Username"), widget=TextInput)
	password1 = forms.CharField(label=_("Password"), widget=PasswordInput, validators=[validators.MinLengthValidator(3)])
	password2 = forms.CharField(label=_("Password confirmation"), widget=PasswordInput)

	def clean(self):
		cleaned_data = super(SignupForm, self).clean()
		password1 = cleaned_data.get('password1')
		password2 = cleaned_data.get('password2')

		if password1 and password2 and password1 != password2:
			raise forms.ValidationError(_("The two password fields didn't match."))


class MessagesForm(forms.Form):
	LEVEL_CHOICES = (
		(constants.DEBUG, "Debug"),
		(constants.INFO, "Info"),
		(constants.SUCCESS, "Success"),
		(constants.WARNING, "Warning"),
		(constants.ERROR, "Error"),
	)

	message = forms.CharField()
	level = forms.ChoiceField(choices=LEVEL_CHOICES, initial=constants.INFO)


class SimpleForm(forms.Form):
	text = forms.CharField(widget=TextInput)


SimpleFormSet = formset_factory(SimpleForm, extra=1, min_num=2, validate_min=True)
