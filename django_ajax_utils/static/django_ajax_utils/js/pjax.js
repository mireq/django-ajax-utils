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

var checkUrlSupported = function(url) {
	// very simple check for local URLs
	if ((url[0] === '/' && url[1] !== '/') || url.search('://') === -1) {
		return true;
	}
	else {
		return false;
	}
};

var checkLinkSupported = function(element) {
	return opts.checkUrlSupported(element.getAttribute('href'));
};

var checkFormSupported = function(element) {
	var method = element.getAttribute('method');
	var action = element.getAttribute('action');
	if (method.toLowerCase() == 'post') {
		return false;
	}
	return opts.checkUrlSupported(action);
};

var execEmbeddedScripts = function(element) {
	var flatNodesList = [];
	var flatNodes = function(root) {
		flatNodesList.push(root);
		if (root.childNodes) {
			_.forEach(root.childNodes, flatNodes);
		}
	};
	flatNodes(element);

	_.forEach(flatNodesList, function(element) {
		if (element.nodeName && element.nodeName.toUpperCase() === 'SCRIPT') {
			var type = element.getAttribute('type');
			if (!type || type.toLowerCase() === 'text/javascript') {
				var scriptData = (element.text || element.textContent || element.innerHTML || "" );
				eval(scriptData); // jshint ignore:line
			}
		}
	});
};

var register = function(element) {
	var links = element.getElementsByTagName('A');
	var forms = element.getElementsByTagName('FORM');
	_.forEach(links, registerPjaxLink);
	_.forEach(forms, registerPjaxForm);
};

var requestStart = function() {
	if (opts.bodyLoadingCls !== undefined) {
		_.addClass(document.body, opts.bodyLoadingCls);
	}
};

var requestDone = function() {
	if (opts.bodyLoadingCls !== undefined) {
		_.removeClass(document.body, opts.bodyLoadingCls);
	}
};

var pjaxFallback = function(response, url, options) {
	document.open();
	document.write(response.responseText); // jshint ignore:line
	document.close();
	if (options.history) {
		window.history.replaceState({is_pjax: true}, null, url);
	}
};

var processPjax = function(response, url, options) {
	if (response.redirect !== undefined) {
		window.location = response.redirect;
		return;
	}
	var extrajsRx = /src="([^"]*)"/g;
	var extrastyleRx = /<link([^>]*)>/g;
	var extrajsBlock = response.blocks[opts.extrajsBlock];
	var extrastyleBlock = response.blocks[opts.extrastyleBlock];
	var extrajs = [];
	var extrastyle = [];
	var match;

	if (extrajsBlock !== undefined) {
		do {
			match = extrajsRx.exec(extrajsBlock);
			if (match !== null) {
				extrajs.push(match[1]);
			}
		} while (match !== null);
	}
	if (extrastyleBlock !== undefined) {
		do {
			match = extrastyleRx.exec(extrastyleBlock);
			if (match !== null) {
				extrastyle.push(match[1]);
			}
		} while (match !== null);
	}

	_.loaderJs(extrajs, function() {
		var pjaxContainer = _.id(opts.pjaxContainerId);
		pjaxContainer.innerHTML = response.content;
		execEmbeddedScripts(pjaxContainer);
		_.triggerLoad(pjaxContainer);

		if (opts.titleBlock !== undefined && response.blocks[opts.titleBlock] !== undefined) {
			_.tag(document, 'title')[0].innerHTML = response.blocks[opts.titleBlock];
		}

		if (opts.onLoaded !== undefined) {
			opts.onLoaded(response, url);
		}
	});

	_.forEach(extrastyle, function(item) {
		if (extrastyleCode.indexOf(item) !== -1) {
			return;
		}
		extrastyleCode.push(item);
		var el = document.createElement('HTML');
		el.innerHTML = "<html><head>" + item + "</head><body></body></html>";
		var links = el.getElementsByTagName('LINK');
		_.forEach(links, function(link) {
			var newLink = link.cloneNode();
			document.getElementsByTagName('head')[0].appendChild(newLink);
		});
	});
};

var pushState = function(url) {
	if (firstrun) {
		window.history.replaceState({is_pjax: true, url: window.location + ''}, null, window.location);
		firstrun = false;
	}
	window.history.pushState({is_pjax: true, url: url}, null, url);
	window.scrollTo(0, 0);

	var base = document.getElementsByTagName('BASE')[0];
	if (base !== undefined) {
		base.href = (url.split('?')[0]).split('#')[0];
	}
};

var popState = function(e) {
	if (e.state === null || !e.state.is_pjax) {
		return;
	}
	pjax.load(e.state.url, { history: false });
};

if (isSupported) {
	pjax.autoRegister = function(options) {
		options = options || {};
		opts = _.lightCopy(options);
		opts.checkLinkSupported = opts.checkLinkSupported || checkLinkSupported;
		opts.checkFormSupported = opts.checkFormSupported || checkFormSupported;
		opts.checkUrlSupported = opts.checkUrlSupported || checkUrlSupported;
		opts.bodyLoadingCls = opts.bodyLoadingCls || 'loading';
		opts.pjaxContainerId = opts.pjaxContainerId || 'pjax_container';
		opts.extrajsBlock = opts.extrajsBlock || 'pjax_container';
		opts.extrastyleBlock = opts.extrastyleBlock || 'pjax_container';
		opts.titleBlock = opts.titleBlock || undefined;
		opts.onLoaded = opts.onLoaded || undefined;
		_.onLoad(function(e) { register(e.memo); });
	};
	pjax.load = function(link, options) {
		var ignoreLink = false;
		var pjaxOptions = options || {};
		if (pjaxOptions.history === undefined) {
			pjaxOptions.history = true;
		}
		if (pjaxOptions.history) {
			pushState(link);
		}
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
					processPjax(response, options.url, pjaxOptions);
				}
				else {
					pjaxFallback(res, options.url, pjaxOptions);
				}
				requestDone();
			},
			failFn: function(response, options) {
				if (ignoreLink) {
					return;
				}
				pjaxFallback(response, options.url, pjaxOptions);
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
	_.bindEvent(window, 'popstate', popState);
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
