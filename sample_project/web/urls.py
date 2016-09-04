# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf.urls import url

from . import views


urlpatterns = [
	url(r'^$', views.home, name='home'),
	url(r'^utils/$', views.utils, name='utils'),
	url(r'^ajaxform/$', views.ajaxform, name='ajaxform'),
]
