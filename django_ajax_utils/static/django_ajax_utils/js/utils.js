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

window._utils.forEach = forEach;
window._utils.map = map;
window._utils.some = some;
window._utils.every = every;
window._utils.filter = filter;


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


}());
