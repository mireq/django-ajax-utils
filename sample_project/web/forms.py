# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django import forms
from django.utils.translation import ugettext_lazy as _


# Hack for disable required html attribute
class TextInput(forms.TextInput):
	def use_required_attribute(self, initial):
		return False


class PasswordInput(forms.PasswordInput):
	def use_required_attribute(self, initial):
		return False


class SignupForm(forms.Form):
	username = forms.CharField(label=_("Username"), widget=TextInput)
	password1 = forms.CharField(label=_("Password"), widget=PasswordInput)
	password2 = forms.CharField(label=_("Password confirmation"), widget=PasswordInput)

	def clean(self):
		cleaned_data = super(SignupForm, self).clean()
		password1 = cleaned_data.get('password1')
		password2 = cleaned_data.get('password2')

		if password1 and password2 and password1 != password2:
			raise forms.ValidationError(_("The two password fields didn't match."))
