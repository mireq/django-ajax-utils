# -*- coding: utf-8 -*-
from django.http.response import HttpResponseRedirect, HttpResponsePermanentRedirect


class PlainRedirect(object):
	plain_redirect = True


class PlainHttpResponseRedirect(PlainRedirect, HttpResponseRedirect):
	pass


class PlainHttpResponsePermanentRedirect(PlainRedirect, HttpResponsePermanentRedirect):
	pass
