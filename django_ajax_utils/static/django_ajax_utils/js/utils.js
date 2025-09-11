(function () {

"use strict";

window._utils = window._utils || {};

var ap = Array.prototype;

// misc

function has(array, key) {
	return Object.prototype.hasOwnProperty.call(array, key);
}

function isEqual(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}

function deepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function lightCopy(obj) {
	var copy = {};
	for (var prop in obj) {
		if (has(obj, prop)) {
			copy[prop] = obj[prop];
		}
	}
	return copy;
}

window._utils.has = has;
window._utils.isEqual = isEqual;
window._utils.deepCopy = deepCopy;
window._utils.lightCopy = lightCopy;

// features
function checkFeatures(features) {
	for (var i = 0; i < features.length; ++i) {
		switch (features[i]) {
			case "ajax":
				return window.XMLHttpRequest !== undefined;
			case "history_push":
				if (window.history && window.history.pushState) {
					return true;
				}
				else {
					return false;
				}
				break;
			case "touch":
				return "ontouchstart" in window;
			case "drop":
				return "ondrop" in window;
			case "file":
				return "File" in window && "FileReader" in window;
			default:
				return false;
		}
	}
	return true;
}

window._utils.checkFeatures = checkFeatures;

// cookies
function getCookie(name) {
	var cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			var cookie = cookies[i].trim();
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) == (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

function setCookie(name, value, days) {
	var expires;
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		expires = "; expires="+date.toGMTString();
	}
	else {
		expires = "";
	}
	document.cookie = name+"="+value+expires+"; path=/; SameSite=Lax";
}

window._utils.getCookie = getCookie;
window._utils.setCookie = setCookie;

// iteration
function forEach(collection, fn) {
	return ap.forEach.call(collection, fn);
}

function forEachDict(collection, fn) {
	for (var key in collection) {
		if (has(collection, key)) {
			var value = collection[key];
			fn(key, value);
		}
	}
}

function dictToPairs(collection) {
	var pairs = [];
	forEachDict(collection, function(key, value) {
		pairs.push([key, value]);
	});
	return pairs;
}

function pairsToDict(collection) {
	var dict = {};
	forEach(collection, function(item) {
		dict[item[0]] = item[1];
	});
	return dict;
}

function map(collection, fn) {
	return ap.map.call(collection, fn);
}

function some(collection, fn) {
	return ap.some.call(collection, fn);
}

function every(collection, fn) {
	return ap.every.call(collection, fn);
}

function filter(collection, fn) {
	return ap.filter.call(collection, fn);
}

function keys(dct) {
	return Object.keys(dct);
}

window._utils.forEach = forEach;
window._utils.forEachDict = forEachDict;
window._utils.dictToPairs = dictToPairs;
window._utils.pairsToDict = pairsToDict;
window._utils.map = map;
window._utils.some = some;
window._utils.every = every;
window._utils.filter = filter;
window._utils.keys = keys;


// events
var eventClasses = {
	click: MouseEvent
};

function triggerEvent(element, name, memo, bubbles) {
	var cls = eventClasses[name] || Event;
	var event = new cls(name, {bubbles: bubbles === false ? false : true, cancelable: true});
	event.memo = memo || { };
	element.dispatchEvent(event);
}

function bindEvent(element, name, fn) {
	element.addEventListener(name, fn, false);
}

function unbindEvent(element, name, fn) {
	element.removeEventListener(name, fn, false);
}

function onLoad(callback) {
	if (document.body) {
		callback({memo: document.body});
		bindEvent(document.body, 'contentloaded', callback);
	}
	else {
		document.addEventListener("DOMContentLoaded", function(event) {
			callback({memo: document.body});
			bindEvent(document.body, 'contentloaded', callback);
		});
	}
}

function onUnload(callback) {
	bindEvent(document.body, 'contentunloaded', callback);
}

function triggerLoad(element) {
	triggerEvent(document.body, 'contentloaded', element, false);
}

function triggerUnload(element) {
	triggerEvent(document.body, 'contentunloaded', element, false);
}

function unbindOnLoad(callback) {
	if (document.body) {
		unbindEvent(document.body, 'contentloaded', callback);
	}
	else {
		document.addEventListener("DOMContentLoaded", function(event) {
			unbindEvent(document.body, 'contentloaded', callback);
		});
	}
}

function unbindOnUnLoad(callback) {
	unbindEvent(document.body, 'contentunloaded', callback);
}

function getAttachToElement(attachTo) {
	if (attachTo === undefined) {
		attachTo = document.body;
	}
	return attachTo;
}

function getElementEventsBound(element) {
	if (element._eventsBound === undefined) {
		element._eventsBound = {};
	}
	return element._eventsBound;
}

function makeEventDispatcher(fn, selector, attachTo) {
	var wrapped = function(e) {
		var target = e.target;
		if (target.matches(selector)) {
			fn(e, target);
		}
		else {
			var closest = target.closest(selector);
			if (closest !== null && (attachTo === closest || attachTo.contains(closest))) {
				fn(e, closest);
			}
		}
	};
	wrapped.wrappedJSObject = fn;
	return wrapped;
}

function listen(selector, event, fn, attachTo) {
	attachTo = getAttachToElement(attachTo);
	if (selector === null) {
		bindEvent(attachTo, event, fn);
	}
	else {
		var bound = getElementEventsBound(attachTo);
		var wrapped = makeEventDispatcher(fn, selector, attachTo);
		bound[fn] = wrapped;
		bindEvent(attachTo, event, wrapped);
	}
}

function unlisten(selector, event, fn, attachTo) {
	attachTo = getAttachToElement(attachTo);
	if (selector === null) {
		unbindEvent(attachTo, event, fn);
	}
	else {
		var bound = getElementEventsBound(attachTo);
		var wrapped = bound[fn];
		delete bound[fn];
		unbindEvent(attachTo, event, wrapped);
	}
}

var liveListeners = [];
var liveRegistered = false;

function getAttachToListeners(element, listener) {
	if (listener.attachTo === undefined) {
		return qa(listener.selector, element, true);
	}
	else {
		if (typeof listener.attachTo === 'string' || listener.attachTo instanceof String) {
			return qa(listener.attachTo, element, true);
		}
		else if (Array.isArray(listener.attachTo)) {
			return listener.attachTo;
		}
		else {
			return [listener.attachTo];
		}
	}
}

function registerLiveListener(element, listener) {
	var attachElements = getAttachToListeners(element, listener);
	var selector = (listener.attachTo === undefined) ? null : listener.selector;
	attachElements.forEach(function(element) {
		listen(selector, listener.event, listener.fn, element);
	});
}

function unregisterLiveListener(element, listener) {
	var attachElements = getAttachToListeners(element, listener);
	var selector = (listener.attachTo === undefined) ? null : listener.selector;
	attachElements.forEach(function(element) {
		unlisten(selector, listener.event, listener.fn, element);
	});
}

function live(selector, event, fn, attachTo) {
	if (!liveRegistered) {
		onLoad(function(e) {
			liveListeners.forEach(function(listener) {
				registerLiveListener(e.memo, listener);
			});
		});

		onUnload(function(e) {
			liveListeners.forEach(function(listener) {
				unregisterLiveListener(e.memo, listener);
			});
		});
		liveRegistered = true;
	}
	var listener = {selector: selector, event: event, fn: fn, attachTo: attachTo};
	liveListeners.push(listener);
	registerLiveListener(document.body, listener);
}

var autoInitializers = [];
var autoInitializersRegistered = false;

function autoInitializersTrigger(element, loaded, initializer) {
	if (!autoInitializersRegistered) {
		return;
	}
	function processInitializer(initializer) {
		qa(initializer.selector, element, true).forEach(function(matchElement) {
			var fn = loaded ? initializer.load : initializer.unload;
			if (fn !== undefined) {
				fn(matchElement);
			}
		});
	}
	if (initializer === undefined) {
		autoInitializers.forEach(function(initializer) {
			processInitializer(initializer);
		});
	}
	else {
		processInitializer(initializer);
	}
}

function autoInitialize(selector, loadListener, unloadListener) {
	var initializer = {selector: selector, load: loadListener, unload: unloadListener};
	autoInitializers.push(initializer);
	if (autoInitializersRegistered === false) {
		onLoad(function(e) { autoInitializersTrigger(e.memo || document.body, true); });
		onUnload(function(e) { autoInitializersTrigger(e.memo || document.body, false); });
		autoInitializersRegistered = true;
	}
	autoInitializersTrigger(document.body, true, initializer);
}

window._utils.triggerEvent = triggerEvent;
window._utils.bindEvent = bindEvent;
window._utils.unbindEvent = unbindEvent;
window._utils.onLoad = onLoad;
window._utils.triggerLoad = triggerLoad;
window._utils.onUnload = onUnload;
window._utils.unbindOnLoad = unbindOnLoad;
window._utils.onUnload = onUnload;
window._utils.triggerUnload = triggerUnload;
window._utils.live = live;
window._utils.listen = listen;
window._utils.unlisten = unlisten;
window._utils.autoInitialize = autoInitialize;

// dom
var el = document.createElement('DIV');

function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function hasClass(elem, cls) {
	return elem.classList.contains(cls);
}

function addClass(elem, cls) {
	return elem.classList.add(cls);
}

function removeClass(elem, cls) {
	return elem.classList.remove(cls);
}

function toggleClass(elem, cls) {
	return elem.classList.toggle(cls);
}

function setClass(elem, cls, enabled) {
	return elem.classList.toggle(cls, enabled ? true : false);
}

function getElementById(parent, id) {
	if (id === undefined) {
		return document.getElementById(parent);
	}
	else {
		var element = document.getElementById(id);
		if (isParentOf(element, parent)) {
			return element;
		}
		else {
			return null;
		}
	}
}

function getElementsByTagName(parent, tag) {
	if (tag === undefined) {
		tag = parent;
		parent = document.body;
	}
	return parent.getElementsByTagName(tag);
}

function q(selector, element, include_self) {
	if (element === undefined) {
		element = document;
	}
	if (include_self && element.matches(selector)) {
		return element;
	}
	return element.querySelector(selector);
}

function queryElements(sel, element, include_self, type) {
	if (element === undefined) {
		element = document;
	}
	var elements = ap.slice.call(type === 'cls' ? element.getElementsByClassName(sel) : element.querySelectorAll(sel));
	if (include_self) {
		if (type === 'cls' ? element.classList.contains(sel) : element.matches(sel)) {
			elements.unshift(element);
		}
	}
	return elements;
}

function qa(selector, element, include_self) {
	return queryElements(selector, element, include_self, 'q');
}

function cla(cls, element, include_self) {
	return queryElements(cls, element, include_self, 'cls');
}

function cls(parent, cls) {
	if (cls === undefined) {
		cls = parent;
		parent = document.body;
	}
	return cla(cls, parent);
}

function isNode(o) {
	return (
		typeof Node === "object" ? o instanceof Node :
		o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
	);
}

function isElement(o) {
	return (
		typeof HTMLElement === "object" ? o instanceof HTMLElement :
		o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
	);
}

function isParentOf(element, parent) {
	while (element) {
		element = element.parentNode;
		if (!(element instanceof Element)) {
			return false;
		}
		if (element === parent) {
			return true;
		}
	}
	return false;
}

function findParent(element, checkFn) {
	while (element) {
		element = element.parentNode;
		if (!(element instanceof Element)) {
			return null;
		}
		if (checkFn(element)) {
			return element;
		}
	}
	return null;
}

function findParentByCls(element, cls) {
	return findParent(element, function(el) {
		return hasClass(el, cls);
	});
}

function findParentByTag(element, tag) {
	var searchTag = tag.toLowerCase();
	return findParent(element, function(el) {
		return el.tagName.toLowerCase() === searchTag;
	});
}

function elem(elementName, attrs, content) {
	var element = document.createElement(elementName);
	if (attrs !== undefined) {
		for (var attrName in attrs) {
			if (has(attrs, attrName)) {
				element.setAttribute(attrName, attrs[attrName]);
			}
		}
	}

	if (content !== undefined) {
		if (isElement(content)) {
			element.appendChild(content);
		}
		else {
			element.appendChild(document.createTextNode(content));
		}
	}
	return element;
}

function insertAfter(newNode, referenceNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

window._utils.escapeHTML = escapeHTML;
window._utils.hasClass = hasClass;
window._utils.addClass = addClass;
window._utils.removeClass = removeClass;
window._utils.toggleClass = toggleClass;
window._utils.setClass = setClass;
window._utils.id = getElementById;
window._utils.tag = getElementsByTagName;
window._utils.q = q;
window._utils.qa = qa;
window._utils.cla = cla;
window._utils.cls = cls;
window._utils.isNode = isNode;
window._utils.isElement = isElement;
window._utils.isParentOf = isParentOf;
window._utils.findParent = findParent;
window._utils.findParentByCls = findParentByCls;
window._utils.findParentByTag = findParentByTag;
window._utils.elem = elem;
window._utils.insertAfter = insertAfter;


// data
function getData(element, name) {
	return element.dataset[name];
}

function setData(element, name, value) {
	element.dataset[name] = value;
}

_utils.getData = getData;
_utils.setData = setData;


// resize listener

var resizeListenerElements = [];
var resizeListenerData = [];
var resizeListenerTimer;

function checkResize() {
	for (var i = 0, leni = resizeListenerElements.length; i < leni; i++) {
		var element = resizeListenerElements[i];
		var lastSize = resizeListenerData[i].lastSize;
		var newWidth = element.offsetWidth;
		var newHeight = element.offsetHeight;
		if (lastSize === undefined || lastSize[0] != newWidth || lastSize[1] != newHeight) {
			triggerEvent(element, 'resized', [newWidth, newHeight]);
		}
		lastSize = [newWidth, newHeight];
		resizeListenerData[i].lastSize = lastSize;
	}
}

bindEvent(window, 'resize', checkResize);

function ResizeListener(element) {
	if (resizeListenerTimer === undefined) {
		resizeListenerTimer = setInterval(checkResize, 250);
	}

	resizeListenerElements.push(element);
	resizeListenerData.push({});

	this.cancel = function() {
		var idx = resizeListenerElements.indexOf(element);
		if (idx > -1) {
			resizeListenerElements.splice(idx, 1);
			resizeListenerData.splice(idx, 1);
		}
		if (resizeListenerElements.length === 0 && resizeListenerTimer) {
			clearInterval(resizeListenerTimer);
			resizeListenerTimer = undefined;
		}
	};
}

function getViewportSize() {
	var w = window;
	var d = document;
	var e = d.documentElement;
	var g = d.getElementsByTagName('body')[0];
	var x = w.innerWidth || e.clientWidth || g.clientWidth;
	var y = w.innerHeight|| e.clientHeight|| g.clientHeight;
	return [x, y];
}


window._utils.ResizeListener = ResizeListener;
window._utils.getViewportSize = getViewportSize;


// scroll
function findGlobalPos(obj) {
	var curleft = 0;
	var curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent); // jshint ignore:line
		return [curleft, curtop];
	}
}

function findVerticalPos(obj) {
	var pos = findGlobalPos(obj);
	if (pos) {
		return pos[1];
	}
}

function scrollToElement(element) {
	if (window.scroll) {
		var posOffset = 0;
		if (window.innerHeight !== undefined) {
			posOffset = window.innerHeight / 2;
		}
		window.scroll(0, Math.max(findVerticalPos(element) - posOffset, 0));
	}
}

function getScroll(){
	if(window.pageYOffset !== undefined){
		return [pageXOffset, pageYOffset];
	}
	else {
		var sx, sy;
		var d = document.documentElement;
		var b = document.body;
		sx = d.scrollLeft || b.scrollLeft || 0;
		sy = d.scrollTop || b.scrollTop || 0;
		return [sx, sy];
	}
}

window._utils.findGlobalPos = findGlobalPos;
window._utils.findVerticalPos = findVerticalPos;
window._utils.scrollToElement = scrollToElement;
window._utils.getScroll = getScroll;


// debounce
function debounce(fn, delay) {
	var timer = null;
	var closure = function () {
		var context = this, args = arguments;
		clearTimeout(timer);
		timer = setTimeout(function () {
			fn.apply(context, args);
		}, delay);
	};
	var instant = function() {
		var context = this, args = arguments;
		clearTimeout(timer);
		fn.apply(context, args);
	};
	closure.instant = instant;
	return closure;
}

window._utils.debounce = debounce;


// script loader

var loaderJs = (function () {
	var head = document.getElementsByTagName('head')[0];
	var loadedPaths;
	var errorPaths = [];
	var registeredPaths = [];
	var waitingCallbacks = [];

	var scriptIsReady = function(state) {
		return (state === 'loaded' || state === 'complete' || state === 'uninitialized' || !state);
	};

	var fireCallbacks = function() {
		var firedCallbacks = [];
		forEach(waitingCallbacks, function(callback, i) {
			var fn = callback[0][0];
			var errorFn = callback[0][1];
			var paths = callback[1];

			if (some(paths, function(path) { return errorPaths.indexOf(path) !== -1; })) {
				firedCallbacks.push(i);
				if (errorFn !== undefined) {
					setTimeout(errorFn, 0);
					return;
				}
			}

			if (every(paths, function(path) { return loadedPaths.indexOf(path) !== -1; })) {
				firedCallbacks.push(i);
				setTimeout(fn, 0); // async call
			}
		});
		firedCallbacks.reverse();
		for (var i = 0; i < firedCallbacks.length; ++i) {
			waitingCallbacks.splice(firedCallbacks[i], 1);
		}
	};

	return function(paths, callback, error) {
		var missingPaths = [];
		if (loadedPaths === undefined) {
			loadedPaths = [];
			var scripts = window._utils.tag('SCRIPT');
			forEach(scripts, function(script) {
				if (script.hasAttribute('src')) {
					loadedPaths.push(script.getAttribute('src'));
					registeredPaths.push(script.getAttribute('src'));
				}
			});
		}

		var pathList = []
		forEach(paths, function(path) {
			// check if path is object
			var scriptAttributes = {};
			if (typeof path === 'object' && path !== null) {
				if (path.type) {
					scriptAttributes.type = path.type;
				}
				path = path.path;
			}
			pathList.push(path);
			if (registeredPaths.indexOf(path) === -1) {
				missingPaths.push([path, scriptAttributes]);
				registeredPaths.push(path);
			}
		});

		waitingCallbacks.push([[callback, error], pathList]);

		var loadMissingPath = function() {
			if (missingPaths.length === 0) {
				return;
			}
			var pathRequest = missingPaths[0];
			var path = pathRequest[0];
			var attrs = pathRequest[1];
			missingPaths = missingPaths.splice(1);
			var script = document.createElement('SCRIPT');
			for (var attr in attrs) {
				if (has(attrs, attr)) {
					script.setAttribute(attr, attrs[attr]);
				}
			}
			script.onreadystatechange = script.onload = function(path) {
				return function() {
					if (scriptIsReady(script.readyState)) {
						loadedPaths.push(path);
						if (missingPaths.length === 0) {
							setTimeout(fireCallbacks, 0);
						}
						else {
							loadMissingPath();
						}
					}
				};
			}(path);
			script.onerror = function(path) {
				return function() {
					loadedPaths.push(path);
					errorPaths.push(path);
					setTimeout(fireCallbacks, 0);
					if (window.console) {
						window.console.warn("Script " + path + " not loaded.");
					}
				};
			}(path);
			script.src = path;
			head.appendChild(script);
		};

		loadMissingPath();

		setTimeout(fireCallbacks, 0);
	};
})();

window._utils.loaderJs = loaderJs;

function execEmbeddedScripts(element) {
	var flatNodesList = [];
	var flatNodes = function(root) {
		flatNodesList.push(root);
		if (root.childNodes) {
			forEach(root.childNodes, flatNodes);
		}
	};
	flatNodes(element);

	forEach(flatNodesList, function(element) {
		if (element.nodeName && element.nodeName.toUpperCase() === 'SCRIPT') {
			var type = element.getAttribute('type');
			if (!type || type.toLowerCase() === 'text/javascript') {
				var scriptData = (element.text || element.textContent || element.innerHTML || "" );
				eval(scriptData); // jshint ignore:line
			}
		}
	});
}

window._utils.execEmbeddedScripts = execEmbeddedScripts;


// forms
function serializeFormElement(element, opts) {
	var q = [];
	var addParameter = function(name, value) {
		q.push([name, value]);
	};

	if (!(opts && opts.includeDisabled) && (element.name === '' || element.disabled)) {
		return [];
	}

	switch (element.nodeName.toLowerCase()) {
		case 'input':
			switch (element.type) {
				case 'checkbox':
				case 'radio':
					if (element.checked) {
						addParameter(element.name, element.value);
					}
					break;
				case 'file':
					if (element.files) {
						forEach(element.files, function(file) {
							addParameter(element.name, file);
						});
					}
					break;
				case 'reset':
				case 'submit':
					break;
				default:
					addParameter(element.name, element.value);
					break;
			}
			break;
		case 'textarea':
			addParameter(element.name, element.value);
			break;
		case 'select':
			switch (element.type) {
				case 'select-one':
					addParameter(element.name, element.value);
					break;
				case 'select-multiple':
					_utils.forEach(element.options, function(option) {
						if (option.selected) {
							addParameter(element.name, option.value);
						}
					});
					break;
			}
			break;
		case 'button':
			break;
	}
	return q;
}

function serializeForm(formElement, options) {
	var o = lightCopy(options || {});
	var q = [];
	var addParameter;

	if (o.raw) {
		addParameter = function(name, value) {
			q.push([name, value]);
		};
	}
	else {
		addParameter = function(name, value) {
			q.push(encodeURIComponent(name) + '=' + encodeURIComponent(value));
		};
	}

	_utils.forEach(formElement.elements, function(element) {
		_utils.forEach(_utils.serializeFormElement(element, o), function(name_value) {
			var name = name_value[0];
			var value = name_value[1];
			addParameter(name, value);
		});
	});


	if (o.raw) {
		return q;
	}
	else {
		return q.join('&');
	}
}

function getUrlParameterByName(name, url) {
	var location = url || window.location;
	var nameReg = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + nameReg + "=([^&#]*)");
	var results = regex.exec(location);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function encodeURLParameters(parameters) {
	var urlParameterList = parameters;
	if (!Array.isArray(parameters)) {
		urlParameterList = dictToPairs(urlParameterList);
	}

	var urlComponents = [];
	forEach(urlParameterList, function(parameter) {
		urlComponents.push(encodeURIComponent(parameter[0]) + '=' + encodeURIComponent(parameter[1]));
	});
	return urlComponents.join('&');
}

function decodeURLParameters(data) {
	var parameters = [];
	if (data === '') {
		return parameters;
	}
	var components = data.split('&');
	forEach(components, function(component) {
		var separatorPosition = component.indexOf('=');
		if (separatorPosition === -1) {
			parameters.push([decodeURIComponent(component), '']);
		}
		else {
			var name = decodeURIComponent(component.slice(0, separatorPosition));
			var value = decodeURIComponent(component.slice(separatorPosition + 1));
			parameters.push([name, value]);
		}
	});
	return parameters;
}

function addURLParameters(url, parameters) {
	var encodedParameters = encodeURLParameters(parameters);
	var finalUrl = url;
	if (encodedParameters.length > 0) {
		if (finalUrl.indexOf('?') === -1) {
			finalUrl += '?' + encodedParameters;
		}
		else {
			finalUrl += '&' + encodedParameters;
		}
	}
	return finalUrl;
}

window._utils.serializeFormElement = serializeFormElement;
window._utils.serializeForm = serializeForm;
window._utils.getUrlParameterByName = getUrlParameterByName;
window._utils.encodeURLParameters = encodeURLParameters;
window._utils.decodeURLParameters = decodeURLParameters;
window._utils.addURLParameters = addURLParameters;


}());
