(function(_) {

var isSupported = _.checkFeatures(['history_push']);
var pjax = {};
var extrastyleCode = [];
var firstrun = true;
var homeRegistered = false;
var lastState;
var state;
_utils.pjax = pjax;


var evalScript = function(script) {
	var headElement = document.getElementsByTagName("head")[0];
	var scriptElement = document.createElement("script");
	scriptElement.type = "text/javascript";
	scriptElement.appendChild(document.createTextNode(script));
	headElement.insertBefore(scriptElement, headElement.firstChild);
	headElement.removeChild(scriptElement);
};


var pushState = function(url) {
	lastState = state;
	state = {is_pjax: true, url: url};
	window.history.pushState(state, null, url);
	var base = document.getElementsByTagName('BASE')[0];
	if (base !== undefined) {
		base.href = (url.split('?')[0]).split('#')[0];
	}
};

var popState = function(e) {
	if (e.state === null || e.state === undefined || e.state.url === undefined || !e.state.is_pjax) {
		return;
	}
	var options = _.lightCopy(e.state || {});
	options.history = false;
	pjax.load(e.state.url, options);
};


var pjaxLoader = function(options) {
	function checkUrlSupported(url, loader) {
		// very simple check for local URLs
		if (!url) {
			return false;
		}
		if (url[0] === '#') {
			return false;
		}
		if ((url[0] === '/' && url[1] !== '/') || url.search('://') === -1) {
			return true;
		}
		else {
			return false;
		}
	}

	function checkLinkSupported(element, loader) {
		return true;
	}

	function checkFormSupported(element, loader) {
		var method = element.getAttribute('method');
		var action = element.getAttribute('action');
		if (method.toLowerCase() !== 'get') {
			return false;
		}
		return self.checkUrlSupported(action, loader);
	}

	function onRequest(url, loader, options) {
		if (self.bodyLoadingCls !== undefined) {
			_.addClass(document.body, self.bodyLoadingCls);
		}
	}

	function onResponse(status, response, loader, options) {
		if (self.bodyLoadingCls !== undefined) {
			_.removeClass(document.body, self.bodyLoadingCls);
		}
	}

	function onInit(loader, options) {
		if (_.id(options.pjaxContainerId) === null) {
			return;
		}
		state = {
			is_pjax: true,
			url: window.location + '',
		};
		window.history.replaceState(state, null, window.location);
	}

	function requestInterceptor(makeRequest, options) {
		return makeRequest(options);
	}

	var self = {};
	self.options = _.lightCopy(options || {});

	self.bodyLoadingCls = self.options.bodyLoadingCls || 'loading';
	self.pjaxContainerId = self.options.pjaxContainerId || 'pjax_container';
	self.extrajsBlock = self.options.extrajsBlock || 'extrajs';
	self.extrajsBlocks = self.options.extrajsBlocks || [];
	self.extrastyleBlock = self.options.extrastyleBlock || 'extrastyle';
	self.titleBlock = self.options.titleBlock || 'head_title';

	self.checkLinkSupported = self.options.checkLinkSupported || checkLinkSupported;
	self.checkFormSupported = self.options.checkFormSupported || checkFormSupported;
	self.checkUrlSupported = self.options.checkUrlSupported || checkUrlSupported;

	self.onInit = self.options.onInit || onInit;
	self.onLoaded = self.options.onLoaded || function(response, url,  loader, options) {};
	self.onRequest = self.options.onRequest || onRequest;
	self.onResponse = self.options.onResponse || onResponse;
	self.requestInterceptor = self.options.requestInterceptor || requestInterceptor;

	self.onInit(self, options);

	var onPjaxLinkClicked = function(e) {
		if (e.which !== 1) {
			return;
		}
		var element = e.target;
		if (!element) {
			return;
		}
		if (element.tagName && element.tagName.toLowerCase() !== 'a') {
			element = _.findParentByTag(element, 'a');
			if (element === null) {
				return;
			}
		}

		if (!self.checkLinkSupported(element, self)) {
			return;
		}
		if (!self.checkUrlSupported(element.getAttribute('href'), self)) {
			return;
		}
		self.load(element.getAttribute('href'));
		e.preventDefault();
	};

	var registerPjaxLink = function(element) {
		_.bindEvent(element, 'click', onPjaxLinkClicked);
	};

	var registerPjaxForm = function(element) {
		_.bindEvent(element, 'submit', function(e) {
			var link = element.getAttribute('action');
			if (!self.checkFormSupported(element, self)) {
				return;
			}
			var formData = _.serializeForm(element);
			var separator = '?';
			if (link.indexOf('?') !== -1) {
				separator = '&';
			}
			pjax.load(link + separator + formData);
			e.preventDefault();
		});
	};

	self.execEmbeddedScripts = function(element) {
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
					var scriptData = (element.text || element.textContent || element.innerHTML || "");
					evalScript(scriptData);
				}
			}
		});
	};

	var processPjax = function(response, url, options) {
		if (response.redirect !== undefined) {
			if (response.plain_redirect || !self.checkUrlSupported(response.redirect, self)) {
				window.location = response.redirect;
			}
			else {
				pjax.load(response.redirect);
			}
			return;
		}
		var extrajsRx = /src="([^"]*)"/g;
		var extrastyleRx = /<link([^>]+)>/g;
		var extrajsBlocks = [response.blocks[self.extrajsBlock]];
		var extrastyleBlock = response.blocks[self.extrastyleBlock];
		var extrajs = [];
		var extrastyle = [];
		var match;

		_.forEach(self.extrajsBlocks, function(block) {
			extrajsBlocks.push(response.blocks[block]);
		});

		_.forEach(extrajsBlocks, function(extrajsBlock) {
			if (extrajsBlock !== undefined) {
				do {
					match = extrajsRx.exec(extrajsBlock);
					if (match !== null) {
						extrajs.push(match[1]);
					}
				} while (match !== null);
			}
		});
		if (extrastyleBlock !== undefined) {
			do {
				match = extrastyleRx.exec(extrastyleBlock);
				if (match !== null) {
					extrastyle.push(match[0]);
				}
			} while (match !== null);
		}

		function onFinish() {
			var pjaxContainer;
			if (self.pjaxContainerId !== undefined) {
				pjaxContainer = _.id(self.pjaxContainerId);
				if (pjaxContainer !== null) {
					pjaxContainer.innerHTML = response.content;
				}
			}

			if (self.titleBlock !== undefined && response.blocks[self.titleBlock] !== undefined) {
				var titleElement = _.tag(document, 'title')[0];
				if (titleElement !== undefined) {
					titleElement.innerHTML = response.blocks[self.titleBlock];
				}
			}

			if (self.onLoaded !== undefined) {
				self.onLoaded(response, url, self, options);
			}

			if (pjaxContainer !== undefined) {
				self.execEmbeddedScripts(pjaxContainer);
				_.forEach(extrajsBlocks, function(extrajsBlock) {
					var div = _.elem('div');
					div.innerHTML = extrajsBlock;
					self.execEmbeddedScripts(div);
				});
				_.triggerLoad(pjaxContainer);
			}
		}

		_.loaderJs(extrajs, onFinish, onFinish);

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

	var pjaxFallback = function(response, url, options) {
		if (response.status === 0) {
			window.location = url;
			return;
		}
		document.open();
		document.write(response.responseText); // jshint ignore:line
		document.close();
		if (options.history) {
			window.history.replaceState({is_pjax: true, url: url}, null, url);
		}
		window.onpopstate = function(event) {
			document.body.style.display = 'none';
			window.location.reload();
		};
	};

	self.register = function(element) {
		var forms = _.tag(element, 'FORM');
		_.forEach(forms, registerPjaxForm);
		if (homeRegistered) {
			return;
		}
		_.bindEvent(document, 'click', onPjaxLinkClicked);
		if (element === document.body) {
			homeRegistered = true;
		}
	};

	self.load = function(url, options) {
		var ignoreLink = false;
		var pjaxOptions = options || {};
		if (pjaxOptions.history === undefined) {
			pjaxOptions.history = true;
		}
		if (self.onRequest(url, self, pjaxOptions) === false) {
			return;
		}
		if (pjaxOptions.history) {
			pushState(url);
		}
		if (pjaxOptions.response === undefined) {
			var options = {
				url: url,
				extraHeaders: {
					'X-Requested-With': 'PJAXRequest',
					'Accept': 'application/pjax.json, */*;q=0.8'
				},
				successFn: function(response, res, options) {
					if (ignoreLink) {
						return;
					}
					if (self.onResponse("success", response, self, pjaxOptions) === false) {
						return;
					}
					if (response.is_pjax || response.redirect) {
						processPjax(response, options.url, pjaxOptions);
					}
					else {
						pjaxFallback(res, options.url, pjaxOptions);
					}
				},
				failFn: function(response, options) {
					if (ignoreLink) {
						return;
					}
					if (self.onResponse("fail", response, self, pjaxOptions) === false) {
						return;
					}
					pjaxFallback(response, options.url, pjaxOptions);
				},
				headersFn: function(response) {
					var contentType = response.getResponseHeader('content-type');
					if (contentType === null || (contentType.indexOf('application/json') !== 0 && contentType.indexOf('text/html') !== 0)) {
						window.location = url;
						ignoreLink = true;
						if (lastState !== undefined) {
							window.history.replaceState(lastState, null, lastState.url);
						}
						self.onResponse("success", null, self, pjaxOptions);
						return;
					}
				}
			};
			function makeRequest(options) {
				return _.xhrSend(options);
			}
			return self.requestInterceptor(makeRequest, options);
		}
		else {
			return processPjax(pjaxOptions.response, url, pjaxOptions);
		}
	};

	return self;
};


if (isSupported) {
	pjax.autoRegister = function(options) {
		var loader = pjaxLoader(options);
		pjax.load = loader.load;
		_.onLoad(function(e) { loader.register(e.memo); });
		_.bindEvent(window, 'popstate', popState);
	};
	pjax.load = function(link) {
		window.location = link;
	};
	pjax.pushState = pushState;
}
else {
	pjax.autoRegister = function(options) {
		// dummy
	};
	pjax.load = function(link) {
		window.location = link;
	};
	pjax.pushState = function(url) {};
}


}(_utils));
