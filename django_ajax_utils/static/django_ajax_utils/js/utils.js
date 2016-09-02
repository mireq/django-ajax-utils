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

var escapeHTML = function(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
};

window._utils.has = has;
window._utils.isEqual = isEqual;
window._utils.deepCopy = deepCopy;
window._utils.lightCopy = lightCopy;
window._utils.escapeHTML = escapeHTML;

// features
var checkFeatures = function(features) {
	for (var i = 0; i < features.length; ++i) {
		switch (features[i]) {
			case "ajax":
				return window.XMLHttpRequest !== undefined;
			case "history_push":
				return window.history && window.history.pushState;
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

}());
