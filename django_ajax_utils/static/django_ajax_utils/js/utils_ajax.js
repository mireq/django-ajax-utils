(function (_) {
"use strict";

var createXMLHttpRequest = null;
var ajaxForwardError = function(response, options) {
	if (response.status !== 0 && response.responseText) {
		document.open();
		document.write(response.responseText); // jshint ignore:line
		document.close();
		if (window.history !== undefined) {
			window.history.replaceState({}, null, window.location);
		}
		window.onpopstate = function(event) {
			document.body.style.display = 'none';
			window.location.reload();
		};
	}
	else {
		if (window.console) {
			console.log("Response error, status: " + response.status);
		}
		if (options && options.url) {
			window.location = options.url;
		}
	}
};

_.ajaxForwardError = ajaxForwardError;

if (window.XMLHttpRequest) {
	createXMLHttpRequest = function() { return new XMLHttpRequest(); };
}
else {
	createXMLHttpRequest = function() { return new ActiveXObject('Microsoft.XMLHTTP'); };
}

var xhrSend = function(options) {
	var opts = _.lightCopy(options);
	opts.method = options.method || 'GET';
	opts.crossOrigin = options.crossOrigin || false;
	opts.final_url = opts.url;
	var req = createXMLHttpRequest();
	var extraHeaders = options.extraHeaders || {};

	var self = {};

	function dummyAbort() {
	}

	function abort() {
		self.abort = dummyAbort;
		req.onreadystatechange = null;
		req.abort();
	}


	self.request = req;
	self.abort = abort;

	if (window._settings && window._settings.debug) {
		opts.failFn = opts.failFn || ajaxForwardError;
	}

	if (opts.method === 'GET') {
		var dummy = '_dummy=' + new Date().getTime();
		if (opts.final_url.indexOf('?') === -1) {
			opts.final_url += '?' + dummy;
		}
		else {
			opts.final_url += '&' + dummy;
		}
	}

	if (options.progress) {
		_.bindEvent(req.upload, 'progress', options.progress);
	}

	var data = opts.data;
	if (typeof data != 'string' && !(window.FormData !== undefined && data instanceof window.FormData)) {
		data = _.encodeURLParameters(data);
	}

	req.open(opts.method, opts.final_url, true);
	if (!opts.crossOrigin) {
		if (!_.has(extraHeaders, 'X-CSRFToken')) {
			var tokenCookie = _utils.getCookie('csrftoken');
			if (tokenCookie !== null) {
				req.setRequestHeader('X-CSRFToken', tokenCookie);
			}
		}
		if (!_.has(extraHeaders, 'X-Requested-With')) {
			req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		}
	}
	if (options.contentType !== undefined) {
		if (options.contentType !== null) {
			req.setRequestHeader('Content-type', options.contentType);
		}
	}
	else {
		if (opts.method == 'POST') {
			if (!(window.FormData !== undefined && data instanceof window.FormData)) {
				req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			}
		}
	}

	for (var header in extraHeaders) {
		req.setRequestHeader(header, extraHeaders[header]);
	}

	req.onreadystatechange = function () {
		if (req.readyState === 2) {
			if (opts.headersFn !== undefined) {
				opts.headersFn(req);
			}
		}
		if (req.readyState != 4) return;
		self.abort = dummyAbort;
		if (req.status >= 200 && req.status < 400) {
			if (opts.successFn !== undefined) {
				var contentType = req.getResponseHeader('content-type');
				var data;
				if (!req.responseType || req.responseType === 'text') {
					data = req.responseText;
					if (contentType.indexOf('application/json') === 0) {
						data = JSON.parse(data);
						req.isJSON = true;
					}
				}
				else {
					data = req.response;
				}
				opts.successFn(data, req, options);
			}
		}
		else {
			if (opts.failFn !== undefined) {
				opts.failFn(req, options);
			}
		}
	};
	req.send(data);

	return self;
};

window._utils.xhrSend = xhrSend;
window._utils.ajaxForwardError = ajaxForwardError;

}(window._utils));
