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

if (window.XMLHttpRequest) {
	createXMLHttpRequest = function() { return new XMLHttpRequest(); };
}
else {
	createXMLHttpRequest = function() { return new ActiveXObject('Microsoft.XMLHTTP'); };
}

var xhrSend = function(options) {
	var opts = _.lightCopy(options);
	opts.method = options.method || 'GET';
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
	req.setRequestHeader('X-CSRFToken', _utils.getCookie('csrftoken'));
	req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	if (opts.method === 'POST') {
		req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
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
	req.send(opts.data);
};

window._utils.xhrSend = xhrSend;
window._utils.ajaxForwardError = ajaxForwardError;

}(window._utils));
