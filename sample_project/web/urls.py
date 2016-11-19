# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf.urls import url

from . import views


urlpatterns = [
	url(r'^$', views.home_view, name='home'),
	url(r'^utils/$', views.utils_view, name='utils'),
	url(r'^ajaxform/$', views.ajaxform_view, name='ajaxform'),
	url(r'^messages/$', views.messages_view, name='messages'),
	url(r'^pjax/$', views.pjax_view, name='pjax'),
	url(r'^pjax/messages/$', views.pjax_messages_view, name='pjax_messages'),
	url(r'^pjax/forms/$', views.pjax_forms_view, name='pjax_forms'),
]
