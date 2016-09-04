# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django import forms
from django.utils.translation import ugettext_lazy as _


class SignupForm(forms.Form):
	username = forms.CharField(label=_("Username"))
	password1 = forms.CharField(label=_("Password"))
	password2 = forms.CharField(label=_("Password confirmation"))

	def clean(self):
		cleaned_data = super(SignupForm, self).clean()
		password1 = cleaned_data.get('password1')
		password2 = cleaned_data.get('password2')

		if password1 and password2 and password1 != password2:
			raise forms.ValidationError(_("The two password fields didn't match."))
