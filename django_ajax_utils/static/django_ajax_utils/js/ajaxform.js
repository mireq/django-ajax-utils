(function(_) {

"use strict";

/* jshint loopfunc:true */

var submitDisabler = function(formElement) {
	var self = {};

	var enabledSubmits = [];

	_.forEach(formElement.elements, function(element) {
		if (element.getAttribute('type') === 'submit' && element.disabled === false) {
			var content;
			var loadingText = _.getData(element, 'loadingText');
			var disableElement = function() {
				element.disabled = true;
			};
			var enableElement = function() {
				element.disabled = false;
			};
			if (loadingText) {
				if (element.tagName.toLowerCase() === 'input') {
					content = element.value;
					disableElement = function() {
						element.disabled = true;
						element.value = loadingText;
					};
					enableElement = function() {
						element.disabled = false;
						element.value = content;
					};
				}
				else {
					content = element.innerHTML;
					disableElement = function() {
						element.disabled = true;
						element.innerHTML = '';
						element.appendChild(document.createTextNode(loadingText));
					};
					enableElement = function() {
						element.disabled = false;
						element.innerHTML = content;
					};
				}
			}
			enabledSubmits.push({
				element: element,
				disableElement: disableElement,
				enableElement: enableElement
			});
		}
	});

	self.disable = function() {
		_.forEach(enabledSubmits, function(input) {
			input.disableElement();
		});
	};

	self.enable = function() {
		_.forEach(enabledSubmits, function(input) {
			input.enableElement();
		});
	};

	return self;
};


var ajaxformMiddleware = (function() {
	var self = {};
	var callbacks = {};

	var middlewares = ['Response', 'FormData', 'BeforeValidate', 'BeforeSend'];

	var registerCallback = function(callbackType, name, fn) {
		callbacks[callbackType][name] = fn;
	};

	var unregisterCallback = function(callbackType, name) {
		delete callbacks[callbackType][name];
	};

	var callCallbacks = function(callbackType, args) {
		var callbackList = callbacks[callbackType];
		for (var key in callbackList) {
			if (_.has(callbackList, key)) {
				callbackList[key].apply(self, args);
			}
		}
	};

	var makeBindFunction = function(middleware) {
		return function(name, fn) {
			return registerCallback(middleware, name, fn);
		};
	};
	var makeUnbindFunction = function(middleware) {
		return function(name) {
			return unregisterCallback(middleware, name);
		};
	};
	var makeTriggerFunction = function(middleware) {
		return function() {
			return callCallbacks(middleware, arguments);
		};
	};

	_.forEach(middlewares, function(key) {
		callbacks[key] = {};
		self['on' + key + 'Bind'] = makeBindFunction(key);
		self['on' + key + 'Unbind'] = makeUnbindFunction(key);
		self['on' + key] = makeTriggerFunction(key);
	});

	return self;
}());


var ajaxform = function(formElement, options) {
	var self = {};
	var preserveErrors = {__all__: true};
	var clickedButton;
	var o = _.lightCopy(options);
	self.options = o;
	o.processDataExtra = o.processDataExtra || function(form, data, ajaxform) {};
	o.processFormStatusExtra = o.processFormStatusExtra || function(form, data, ajaxform) {}; // for captcha and etc.
	o.nonFieldErrorsClass = o.nonFieldErrorsClass || _.getData(formElement, 'nonFieldErrorsClass') || 'non-field-errors';
	o.fieldErrorsClass = o.fieldErrorsClass || _.getData(formElement, 'fieldErrorsClass') || 'field-errors';
	o.rowClass = o.rowClass || _.getData(formElement, 'rowClass') || 'form-row';
	o.formName = o.formName || _.getData(formElement, 'formName') || 'form';
	o.onlyValidateField = o.onlyValidateField || _.getData(formElement, 'onlyValidateField') || 'only_validate';
	if (!_.has(o, 'liveValidate')) {
		if (_.getData(formElement, 'liveValidate') === 'false') {
			o.liveValidate = false;
		}
		else {
			o.liveValidate = true;
		}
	}

	var errorContainers = {};
	errorContainers.__all__ = _.cls(formElement, o.nonFieldErrorsClass)[0];
	if (!errorContainers.__all__) {
		errorContainers.__all__ = _.elem('div', {'class': o.nonFieldErrorsClass});
		if (formElement.childNodes.length) {
			formElement.insertBefore(errorContainers.__all__, formElement.childNodes[0]);
		}
		else {
			formElement.appendChild(errorContainers.__all__);
		}
	}
	_.forEach(_.cls(formElement, 'field-errors'), function(element) {
		var id = element.getAttribute('id');
		if (id === null) {
			return;
		}
		var idPrefix = id.substr(0, 3);
		var idSuffix = id.substr(id.length - 7, 7);
		if (idPrefix === "id_" && idSuffix === "_errors") {
			var elementName = id.substr(0, id.length - 7);
			errorContainers[elementName] = element;
		}
	});

	var processFormSubmit = function(data, event, opts, disabler) {
		var key;

		o.processDataExtra(data, formElement, o.formName);
		ajaxformMiddleware.onResponse(data, formElement, o.formName);
		if (_.has(data, 'redirect')) {
			_.triggerEvent(formElement, 'submit_success');
			if (_.has(_, 'loadPjax')) {
				_.loadPjax(data.redirect);
			}
			else {
				window.location = data.redirect;
			}
		}
		else if (_.has(data, 'forms')) {
			disabler.enable();
			var row;
			var checkFormRow = function(element) {
				return _.hasClass(element, o.rowClass) || element === formElement;
			};
			for (key in errorContainers) {
				if (_.has(errorContainers, key)) {
					var err = errorContainers[key];
					err.innerHTML = '';
					row = _.findParent(err, checkFormRow);
					if (row !== null) {
						_.removeClass(row, 'has-errors');
						_.removeClass(row, 'no-errors');
					}
				}
			}
			var formData = data.forms[o.formName];
			o.processFormStatusExtra(formElement, formData, o.formName);
			ajaxformMiddleware.onFormData(formElement, formData, o.formName);

			if (!opts.onlyValidate) {
				preserveErrors = {__all__: true};
			}

			for (key in formData.errors) {
				if (_.has(formData.errors, key)) {
					if (opts.onlyValidate && !preserveErrors[key] && formData.empty.indexOf(key) !== -1) {
						continue;
					}

					var errorList = formData.errors[key];
					var errorsElement = _.elem('ul', {'class': 'errors'});
					if (_.has(errorContainers, key)) {
						errorContainers[key].appendChild(errorsElement);
					}
					else {
						errorContainers.__all__.appendChild(errorsElement);
					}
					_.forEach(errorList, function(error) {
						errorsElement.appendChild(_.elem('li', {}, error.message));
					});

					preserveErrors[key] = true;
					row = _.findParent(errorsElement, checkFormRow);
					if (row !== null) {
						_.removeClass(row, 'no-errors');
						_.addClass(row, 'has-errors');
					}
				}
			}
			_.forEach(formData.valid, function(key) {
				row = _.findParent(errorContainers[key], checkFormRow);
				if (row !== null) {
					_.addClass(row, 'no-errors');
				}
			});
		}
		else {
			disabler.enable();
		}
	};

	var formDataToDict = function(formData) {
		var dct = {};
		_.forEach(formData, function(item) {
			var key = item[0];
			var val = item[1];
			if (!_.has(dct, key)) {
				dct[key] = [];
			}
			dct[key].push(val);
		});
		return dct;
	};

	self.initial = _.serializeForm(formElement, {raw: true});

	self.getChanges = function() {
		var currentData = formDataToDict(_.serializeForm(formElement, {raw: true}));
		var initialData = formDataToDict(self.initial);
		var allFields = _.keys(currentData);
		var changes = [];

		_.forEach(allFields, function(fieldName) {
			if (!_.isEqual(currentData[fieldName], initialData[fieldName])) {
				changes.push(fieldName);
			}
		});

		return {
			allFields: allFields,
			changes: changes,
			changed: changes.length > 0
		};
	};

	self.submitForm = function(options) {
		var opts = _.lightCopy(options) || {};
		opts.onlyValidate = opts.onlyValidate || false;

		var data = _.serializeForm(formElement);
		if (opts.onlyValidate) {
			data += '&' + encodeURIComponent(o.onlyValidateField) + '=1';
		}
		if (!clickedButton) {
			clickedButton = submits[0];
		}
		if (clickedButton) {
			var name = clickedButton.name;
			var value = clickedButton.value;
			if (name) {
				data += '&' + encodeURIComponent(name) + '=' + encodeURIComponent(value);
			}
		}
		clickedButton = undefined;

		var url = formElement.getAttribute('action');
		var disabler = submitDisabler(formElement);
		if (opts.onlyValidate) {
			ajaxformMiddleware.onBeforeValidate(data, formElement, o.formName);
		}
		else {
			ajaxformMiddleware.onBeforeSend(data, formElement, o.formName);
			disabler.disable();
		}

		_.xhrSend({
			method: 'POST',
			url: url,
			data: data,
			successFn: function(data, event) {
				processFormSubmit(data, event, opts, disabler);
			},
			failFn: function(req) {
				if (!opts.onlyValidate) {
					disabler.enable();
				}
				_.triggerEvent(formElement, 'submit_fail');
				_.ajaxForwardError(req);
			}
		});
	};

	var inputChanged = function() {
		self.submitForm({onlyValidate: true});
	};
	var inputChangedDelayed = _.debounce(inputChanged, 2000);

	_.forEach(formElement.elements, function(element) {
		_.bindEvent(element, 'change', inputChanged);
		if (o.liveValidate) {
			_.bindEvent(element, 'input', inputChangedDelayed);
			_.bindEvent(element, 'keyup', inputChangedDelayed);
		}
	});

	var submits = [];
	_.forEach(formElement.elements, function(element) {
		if (element.getAttribute('type') === 'submit') {
			submits.push(element);
		}
	});
	_.forEach(submits, function(element) {
		_.bindEvent(element, 'click', function() { clickedButton = this; });
	});
	_.bindEvent(formElement, 'submit', function(e) { self.submitForm(); e.preventDefault(); });
	return self;
};


var register = function(element) {
	_.forEach(_.cls(element, 'ajaxform'), function(formElement) {
		ajaxform(formElement);
	});
};


window._utils.ajaxform = ajaxform;
window._utils.ajaxformMiddleware = ajaxformMiddleware;


_.onLoad(function(e) { register(e.memo); });


}(_utils));
