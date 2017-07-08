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
	url(r'^pjax/form/post/$', views.pjax_form_post_view, name='pjax_form_post'),
	url(r'^pjax/form/get/$', views.pjax_form_get_view, name='pjax_form_get'),
	url(r'^urlpatterns/(?:(?P<param>\w+)/)?$', views.urlpatterns_view, name='urlpatterns'),
	url(r'^form-utils/$', views.form_utils_view, name='form_utils'),
	url(r'^form-utils/foundation/$', views.form_utils_foundation_view, name='form_utils_foundation'),
	url(r'^form-utils/fomset/$', views.formset_view, name='formset'),
	url(r'^form-utils/multiforms/$', views.multiforms_view, name='multiforms'),
]
