(function(_) {

var isSupported = _.checkFeatures(['history_push']);
var firstrun = true;
var pjax = {};
var opts = {};
_utils.pjax = pjax;

var registerPjaxLink = function(element) {
	_.bindEvent(element, 'click', function(e) {
		if (!opts.checkLinkSupported(element)) {
			return;
		}
		pjax.load(element.getAttribute('href'));
		e.preventDefault();
	});
};

var registerPjaxForm = function(element) {
};

var checkLinkSupported = function(element) {
	return true;
};

var checkFormSupported = function(element) {
	var method = element.getAttribute('method');
	if (method.toLowerCase() == 'post') {
		return false;
	}
	return true;
};

var register = function(element) {
	var links = element.getElementsByTagName('A');
	var forms = element.getElementsByTagName('FORM');
	_.forEach(links, registerPjaxLink);
	_.forEach(forms, registerPjaxForm);
};

var requestStart = function() {
	if (opts.loadingCls !== undefined) {
		_.addClass(document.body, opts.loadingCls);
	}
};

var requestDone = function() {
	if (opts.loadingCls !== undefined) {
		_.removeClass(document.body, opts.loadingCls);
	}
};

var pjaxFallback = function(response, url) {
	document.open();
	document.write(response.responseText); // jshint ignore:line
	document.close();
	if (options.history) {
		window.history.replaceState({is_pjax: true}, null, url);
	}
};

var processPjax = function(response, url) {
	if (response.redirect !== undefined) {
		window.location = response.redirect;
		return;
	}
	console.log(response);
};

if (isSupported) {
	pjax.autoRegister = function(options) {
		options = options || {};
		opts = _.lightCopy(options);
		opts.checkLinkSupported = opts.checkLinkSupported || checkLinkSupported;
		opts.checkFormSupported = opts.checkFormSupported || checkFormSupported;
		opts.loadingCls = opts.loadingCls || 'loading';
		_.onLoad(function(e) { register(e.memo); });
	};
	pjax.load = function(link) {
		var ignoreLink = false;
		requestStart();
		_.xhrSend({
			url: link,
			extraHeaders: {
				'X-PJAX': 'true'
			},
			successFn: function(response, res, options) {
				if (ignoreLink) {
					return;
				}
				if (response.is_pjax) {
					processPjax(response, options.url);
				}
				else {
					pjaxFallback(res, options.url);
				}
				requestDone();
			},
			failFn: function(response, options) {
				if (ignoreLink) {
					return;
				}
				pjaxFallback(response, options.url);
				requestDone();
			},
			headersFn: function(response) {
				var contentType = response.getResponseHeader('content-type');
				if (contentType.indexOf('application/json') !== 0 && contentType.indexOf('text/html') !== 0) {
					window.location = link;
					ignoreLink = true;
					return;
				}
			}
		});
	};
}
else {
	pjax.autoRegister = function(options) {
		// dummy
	};
	pjax.load = function(link) {
		window.location = link;
	};
}

}(_utils));
