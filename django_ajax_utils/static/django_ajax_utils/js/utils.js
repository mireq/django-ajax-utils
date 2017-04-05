(function () {

"use strict";

window._utils = window._utils || {};

// misc

var has = function(array, key) {
	return Object.prototype.hasOwnProperty.call(array, key);
};

var isEqual = function(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
};

var deepCopy = function(obj) {
	return JSON.parse(JSON.stringify(obj));
};

var lightCopy = function(obj) {
	var copy = {};
	for (var prop in obj) {
		if (has(obj, prop)) {
			copy[prop] = obj[prop];
		}
	}
	return copy;
};

window._utils.has = has;
window._utils.isEqual = isEqual;
window._utils.deepCopy = deepCopy;
window._utils.lightCopy = lightCopy;

// features
var checkFeatures = function(features) {
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
			default:
				return false;
		}
	}
	return true;
};

window._utils.checkFeatures = checkFeatures;

// cookies
var getCookie = function(name) {
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
};

var setCookie = function(name, value, days) {
	var expires;
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		expires = "; expires="+date.toGMTString();
	}
	else {
		expires = "";
	}
	document.cookie = name+"="+value+expires+"; path=/";
};

window._utils.getCookie = getCookie;
window._utils.setCookie = setCookie;

// iteration
var forEach;
if (Array.prototype.forEach) {
	var coreForEach = Array.prototype.forEach;
	forEach = function(collection, fn) {
		coreForEach.call(collection, fn);
	};
}
else {
	forEach = function(collection, fn) {
		for (var i = 0, len = collection.length; i < len; i++) {
			fn(collection[i], i);
		}
	};
}

var map;
if (Array.prototype.map) {
	var coreMap = Array.prototype.map;
	map = function(collection, fn) {
		return coreMap.call(collection, fn);
	};
}
else {
	map = function(collection, fn) {
		var outputs = [];
		for (var i = 0, len = collection.length; i < len; i++) {
			outputs.push(fn(collection[i], i, collection));
		}
		return outputs;
	};
}

var some;
if (Array.prototype.some) {
	some = function(array, test) {
		return Array.prototype.some.call(array, test);
	};
}
else {
	some = function(array, test) {
		var ret = false;

		for (var i = 0, len = array.length; i < len; i++) {
			ret = ret || fn(array[i], i);
			if (ret) {
				break;
			}
		}
		return ret;
	};
}

var every;
if (Array.prototype.every) {
	every = function(array, test) {
		return array.every(test);
	};
}
else {
	every = function(array, test) {
		var ret = true;

		for (var i = 0, len = array.length; i < len; i++) {
			ret = ret && fn(array[i], i);
			if (!ret) {
				break;
			}
		}
		return ret;
	};
}

var filter = function(array, fun) {
	if (Array.prototype.filter) {
		return array.filter(fun);
	}
	else {
		var res = [];
		forEach(array, function(val) {
			if (fun.call(val)) {
				res.push(val);
			}
		});
	}
};

var keys = function(dct) {
	var keys = [];
	for (var key in dct) {
		if (has(dct, key)) {
			keys.push(key);
		}
	}
	return keys;
};

window._utils.forEach = forEach;
window._utils.map = map;
window._utils.some = some;
window._utils.every = every;
window._utils.filter = filter;
window._utils.keys = keys;


// events
var triggerEvent = function(element, name, memo) {
	var event;
	if (document.createEvent) {
		event = document.createEvent('HTMLEvents');
		event.initEvent(name, true, true);
	}
	else {
		event = document.createEventObject();
		event.eventType = name;
	}

	event.eventName = name;
	event.memo = memo || { };

	if (document.createEvent) {
		element.dispatchEvent(event);
	}
	else {
		element.fireEvent("on" + event.eventType, event);
	}
};

var bindEvent = function(element, name, fn) {
	if (document.addEventListener) {
		element.addEventListener(name, fn, false);
	}
	else {
		element.attachEvent('on' + name, fn);
	}
};

var unbindEvent = function(element, name, fn) {
	if (document.removeEventListener) {
		element.removeEventListener(name, fn, false);
	}
	else {
		element.detachEvent('on' + name, fn);
	}

};

var onLoad = function(callback) {
	if (document.body) {
		callback({memo: document.body});
		window._utils.bindEvent(document.body, 'contentloaded', callback);
	}
	else {
		document.addEventListener("DOMContentLoaded", function(event) {
			callback({memo: document.body});
			window._utils.bindEvent(document.body, 'contentloaded', callback);
		});
	}
};

var triggerLoad = function(element) {
	window._utils.triggerEvent(document.body, 'contentloaded', element);
};

var unbindOnLoad = function(callback) {
	if (document.body) {
		window._utils.unbindEvent(document.body, 'contentloaded', callback);
	}
	else {
		document.addEventListener("DOMContentLoaded", function(event) {
			window._utils.unbindEvent(document.body, 'contentloaded', callback);
		});
	}
};

window._utils.triggerEvent = triggerEvent;
window._utils.bindEvent = bindEvent;
window._utils.unbindEvent = unbindEvent;
window._utils.onLoad = onLoad;
window._utils.triggerLoad = triggerLoad;
window._utils.unbindOnLoad = unbindOnLoad;

// dom
var el = document.createElement('DIV');

var escapeHTML = function(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
};

var hasClass, addClass, removeClass, toggleClass;
if (el.classList === undefined) {
	hasClass = function(elem, cls) {
		return elem.className.split(" ").indexOf(cls) !== -1;
	};

	addClass = function(elem, cls) {
		elem.className += " " + cls;
	};

	removeClass = function(elem, cls) {
		var classNames = elem.className.split(" ");
		var newClassNames = [];
		for (var i = 0, leni = classNames.length; i < leni; i++) {
			if (classNames[i] != cls) {
				newClassNames.push(classNames[i]);
			}
		}
		elem.className = newClassNames.join(" ");
	};

	toggleClass = function(elem, cls) {
		if (hasClass(elem, cls)) {
			removeClass(elem, cls);
		}
		else {
			addClass(elem, cls);
		}
	};
}
else {
	hasClass = function(elem, cls) {
		return elem.classList.contains(cls);
	};

	addClass = function(elem, cls) {
		return elem.classList.add(cls);
	};

	removeClass = function(elem, cls) {
		return elem.classList.remove(cls);
	};

	toggleClass = function(elem, cls) {
		return elem.classList.toggle(cls);
	};
}

var getElementById = function(parent, id) {
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
};

var getElementsByTagName = function(parent, tag) {
	if (tag === undefined) {
		tag = parent;
		parent = document.body;
	}
	return parent.getElementsByTagName(tag);
};

var getElementsByClassName;
if (el.getElementsByClassName === undefined) {
	getElementsByClassName = function(parent, cls) {
		if (cls === undefined) {
			cls = parent;
			parent = document.body;
		}
		var elements = parent.getElementsByTagName('*');
		var match = [];
		for (var i = 0, leni = elements.length; i < leni; i++) {
			if (hasClass(elements[i], cls)) {
				match.push(elements[i]);
			}
		}
		return match;
	};
}
else {
	getElementsByClassName = function(parent, cls) {
		if (cls === undefined) {
			cls = parent;
			parent = document.body;
		}
		return parent.getElementsByClassName(cls);
	};
}

var isNode = function(o) {
	return (
		typeof Node === "object" ? o instanceof Node :
		o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
	);
};

var isElement = function(o) {
	return (
		typeof HTMLElement === "object" ? o instanceof HTMLElement :
		o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
	);
};

var isParentOf = function(element, parent) {
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
};

var findParent = function(element, checkFn) {
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
};

var findParentByCls = function(element, cls) {
	return findParent(element, function(el) {
		return hasClass(el, cls);
	});
};

var elem = function(elementName, attrs, content) {
	var element = document.createElement(elementName);
	if (attrs !== undefined) {
		for (var attrName in attrs) {
			if (has(attrs, attrName)) {
				element.setAttribute(attrName, attrs[attrName]);
			}
		}
	}

	if (content !== undefined) {
		element.appendChild(document.createTextNode(content));
	}
	return element;
};

var insertAfter = function(newNode, referenceNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

window._utils.escapeHTML = escapeHTML;
window._utils.hasClass = hasClass;
window._utils.addClass = addClass;
window._utils.removeClass = removeClass;
window._utils.toggleClass = toggleClass;
window._utils.id = getElementById;
window._utils.tag = getElementsByTagName;
window._utils.cls = getElementsByClassName;
window._utils.isNode = isNode;
window._utils.isElement = isElement;
window._utils.isParentOf = isParentOf;
window._utils.findParent = findParent;
window._utils.findParentByCls = findParentByCls;
window._utils.elem = elem;
window._utils.insertAfter = insertAfter;


// data
var getData, setData;
if (el.dataset === undefined) {
	var generateDataName = function(name) {
		return name.replace(/([A-Z])/g, '-$1').toLowerCase();
	};

	getData = function(element, name) {
		return element.getAttribute('data-' + generateDataName(name));
	};

	setData = function(element, name, value) {
		element.setAttribute('data-' + generateDataName(name), value);
	};
}
else {
	getData = function(element, name) {
		return element.dataset[name];
	};

	setData = function(element, name, value) {
		element.dataset[name] = value;
	};
}

_utils.getData = getData;
_utils.setData = setData;


// resize listener

var resizeListenerElements = [];
var resizeListenerData = [];
var resizeListenerTimer;

var checkResize = function() {
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
};

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

var getViewportSize = function() {
	var w = window;
	var d = document;
	var e = d.documentElement;
	var g = d.getElementsByTagName('body')[0];
	var x = w.innerWidth || e.clientWidth || g.clientWidth;
	var y = w.innerHeight|| e.clientHeight|| g.clientHeight;
	return [x, y];
};


window._utils.ResizeListener = ResizeListener;
window._utils.getViewportSize = getViewportSize;


// scroll
var findVerticalPos = function(element) {
	var curtop = 0;
	do {
		curtop += element.offsetTop || 0;
		element = element.offsetParent;
	} while(element);
	return curtop;
};

var scrollToElement = function(element) {
	if (window.scroll) {
		var posOffset = 0;
		if (window.innerHeight !== undefined) {
			posOffset = window.innerHeight / 2;
		}
		window.scroll(0, Math.max(window.findVerticalPos(element) - posOffset, 0));
	}
};

var getScroll = function(){
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
};

window._utils.findVerticalPos = findVerticalPos;
window._utils.scrollToElement = scrollToElement;
window._utils.getScroll = getScroll;


// debounce
var debounce = function(fn, delay) {
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
};

window._utils.debounce = debounce;


// script loader

var loaderJs = (function () {
	var head = document.getElementsByTagName('head')[0];
	var loadedPaths;
	var registeredPaths = [];
	var waitingCallbacks = [];

	var scriptIsReady = function(state) {
		return (state === 'loaded' || state === 'complete' || state === 'uninitialized' || !state);
	};

	var fireCallbacks = function() {
		var firedCallbacks = [];
		forEach(waitingCallbacks, function(callback, i) {
			var fn = callback[0];
			var paths = callback[1];
			if (every(paths, function(path) { return loadedPaths.indexOf(path) !== -1; })) {
				firedCallbacks.push(i);
				fn();
			}
		});
		firedCallbacks.reverse();
		for (var i = 0; i < firedCallbacks.length; ++i) {
			waitingCallbacks.splice(firedCallbacks[i], 1);
		}
	};

	return function(paths, callback) {
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

		forEach(paths, function(path) {
			if (registeredPaths.indexOf(path) === -1) {
				missingPaths.push(path);
				registeredPaths.push(path);
			}
		});

		waitingCallbacks.push([callback, paths]);

		forEach(missingPaths, function(path) {
			var script = document.createElement('SCRIPT');
			script.src = path;
			script.onreadystatechange = script.onload = function(path) {
				return function() {
					if (scriptIsReady(script.readyState)) {
						loadedPaths.push(path);
						setTimeout(fireCallbacks, 0);
					}
				};
			}(path);
			head.appendChild(script);
		});

		setTimeout(fireCallbacks, 0);
	};
}());

window._utils.loaderJs = loaderJs;

var execEmbeddedScripts = function(element) {
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
};

window._utils.execEmbeddedScripts = execEmbeddedScripts;


// forms
var serializeFormElement = function(element) {
	var q = [];
	var addParameter = function(name, value) {
		q.push([name, value]);
	};

	if (element.name === '' || element.disabled) {
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
					_utils.forEach(formElement.options, function(option) {
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
};

var serializeForm = function(formElement, options) {
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
		_utils.forEach(_utils.serializeFormElement(element), function(name_value) {
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
};

var getUrlParameterByName = function(name, url) {
	var location = url || window.location;
	var nameReg = nameReg.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + nameReg + "=([^&#]*)");
	var results = regex.exec(location);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
};

window._utils.serializeFormElement = serializeFormElement;
window._utils.serializeForm = serializeForm;
window._utils.getUrlParameterByName = getUrlParameterByName;


if (!Function.prototype.bind) {
	Function.prototype.bind=function(b){if(typeof this!=="function"){throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");}function c(){}var a=[].slice,f=a.call(arguments,1),e=this,d=function(){return e.apply(this instanceof c?this:b||window,f.concat(a.call(arguments)));};c.prototype=this.prototype;d.prototype=new c();return d;}; // jshint ignore:line
}

}());
