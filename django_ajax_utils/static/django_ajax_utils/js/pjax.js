(function(_) {

var isSupported = _.checkFeatures(['history_push']);
var pjax = {};
var extrastyleCode = [];
var firstrun = true;
_utils.pjax = pjax;


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


var pjaxLoader = function(options) {
	var checkUrlSupported = function(url, loader) {
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
	};

	var checkLinkSupported = function(element, loader) {
		return true;
	};

	var checkFormSupported = function(element, loader) {
		var method = element.getAttribute('method');
		var action = element.getAttribute('action');
		if (method.toLowerCase() !== 'get') {
			return false;
		}
		return self.checkUrlSupported(action, loader);
	};

	var onRequest = function(url, loader) {
		if (self.bodyLoadingCls !== undefined) {
			_.addClass(document.body, self.bodyLoadingCls);
		}
	};

	var onResponse = function(url, loader) {
		if (self.bodyLoadingCls !== undefined) {
			_.removeClass(document.body, self.bodyLoadingCls);
		}
	};

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

	self.onLoaded = self.options.onLoaded || function(response, url,  loader) {};
	self.onRequest = self.options.onRequest || onRequest;
	self.onResponse = self.options.onResponse || onResponse;

	var registerPjaxLink = function(element) {
		_.bindEvent(element, 'click', function(e) {
			if (!self.checkLinkSupported(element, self)) {
				return;
			}
			if (!self.checkUrlSupported(element.getAttribute('href'), self)) {
				return;
			}
			self.load(element.getAttribute('href'));
			e.preventDefault();
		});
	};

	var registerPjaxForm = function(element) {
		_.bindEvent(element, 'submit', function(e) {
			var link = element.getAttribute('action');
			if (!self.checkFormSupported(element, self)) {
				return;
			}
			var formData = _.serializeForm(element);
			pjax.load(link + '?' + formData);
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
					var scriptData = (element.text || element.textContent || element.innerHTML || "" );
					eval(scriptData); // jshint ignore:line
				}
			}
		});
	};

	var processPjax = function(response, url, options) {
		if (response.redirect !== undefined) {
			window.location = response.redirect;
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

		_.loaderJs(extrajs, function() {
			if (self.pjaxContainerId !== undefined) {
				var pjaxContainer = _.id(self.pjaxContainerId);
				pjaxContainer.innerHTML = response.content;
				self.execEmbeddedScripts(pjaxContainer);
				_.triggerLoad(pjaxContainer);
			}

			if (self.titleBlock !== undefined && response.blocks[self.titleBlock] !== undefined) {
				_.tag(document, 'title')[0].innerHTML = response.blocks[self.titleBlock];
			}

			if (self.onLoaded !== undefined) {
				self.onLoaded(response, url, self);
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

	var pjaxFallback = function(response, url, options) {
		document.open();
		document.write(response.responseText); // jshint ignore:line
		document.close();
		if (options.history) {
			window.history.replaceState({is_pjax: true}, null, url);
		}
	};

	self.register = function(element) {
		var links = _.tag(element, 'A');
		var forms = _.tag(element, 'FORM');
		_.forEach(links, registerPjaxLink);
		_.forEach(forms, registerPjaxForm);
	};

	self.load = function(url, options) {
		var ignoreLink = false;
		var pjaxOptions = options || {};
		if (pjaxOptions.history === undefined) {
			pjaxOptions.history = true;
		}
		if (pjaxOptions.history) {
			pushState(url);
		}
		self.onRequest(url, self);
		if (pjaxOptions.response === undefined) {
			_.xhrSend({
				url: url,
				extraHeaders: {
					'X-Requested-With': 'PJAXRequest'
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
					self.onResponse("success", response, self);
				},
				failFn: function(response, options) {
					if (ignoreLink) {
						return;
					}
					pjaxFallback(response, options.url, pjaxOptions);
					self.onResponse("fail", response, self);
				},
				headersFn: function(response) {
					var contentType = response.getResponseHeader('content-type');
					if (contentType === null || (contentType.indexOf('application/json') !== 0 && contentType.indexOf('text/html') !== 0)) {
						window.location = link;
						ignoreLink = true;
						return;
					}
				}
			});
		}
		else {
			processPjax(pjaxOptions.response, link, pjaxOptions);
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
