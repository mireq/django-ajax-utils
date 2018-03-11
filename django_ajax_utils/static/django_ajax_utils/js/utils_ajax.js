(function (_) {
"use strict";

var createXMLHttpRequest = null;
var ajaxForwardError = function(response) {
	document.open();
	document.write(response.responseText); // jshint ignore:line
	document.close();
	if (window.history !== undefined) {
		window.history.replaceState({}, null, window.location);
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
	var req = createXMLHttpRequest();
	var extraHeaders = options.extraHeaders || {};
	if (window._settings && window._settings.debug) {
		opts.failFn = opts.failFn || ajaxForwardError;
	}
	if (opts.method === 'GET') {
		var dummy = '_dummy=' + new Date().getTime();
		if (opts.url.indexOf('?') === -1) {
			opts.url += '?' + dummy;
		}
		else {
			opts.url += '&' + dummy;
		}
	}
	req.open(opts.method, opts.url, true);
	if (!opts.crossOrigin) {
		if (!_.has(extraHeaders, 'X-CSRFToken')) {
			req.setRequestHeader('X-CSRFToken', _utils.getCookie('csrftoken'));
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
			req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
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
		if (req.status >= 200 && req.status < 400) {
			if (opts.successFn !== undefined) {
				var contentType = req.getResponseHeader('content-type');
				var data = req.responseText;
				if (contentType.indexOf('application/json') === 0) {
					data = JSON.parse(data);
					req.isJSON = true;
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
	var data = opts.data;
	if (typeof data != 'string' && !(window.FormData !== undefined && data instanceof window.FormData)) {
		data = _.encodeURLParameters(data);
	}
	req.send(data);
};

window._utils.xhrSend = xhrSend;
window._utils.ajaxForwardError = ajaxForwardError;

}(window._utils));
