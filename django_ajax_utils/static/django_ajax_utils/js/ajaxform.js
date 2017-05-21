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


var ajaxformBase = function(formElement, options) {
	var self = {};
	var validate;

	self.formElement = formElement;
	self.options = _.lightCopy(options || {});
	self.options.liveValidate = self.options.liveValidate || false;
	self.options.onlyValidateField = self.options.onlyValidateField || _.getData(formElement, 'onlyValidateField') || 'only_validate';
	self.options.formName = self.options.formName || _.getData(formElement, 'formName') || 'form';
	if (self.options.validateDelay === undefined) {
		self.options.validateDelay = 1000;
	}
	self.inputs = [];
	self.submits = [];
	self.submitButton = undefined;
	self.initial = undefined;

	// === Events ===
	self.onInputChanged = self.options.onInputChanged || function(e, finished) { if (finished) { validate.instant(e); } else { validate(e); } };
	self.onFormSubmit = self.options.onFormSubmit || function(e) { self.submit(); e.preventDefault(); };
	self.onFormSubmitSuccess = self.options.onFormSubmitSuccess || function(data, e) {};
	self.onFormSubmitFail = self.options.onFormSubmitFail || function(response) {};
	// query is mutable
	self.onBeforeValidate = self.options.onBeforeValidate || function(query, formElement, formName) {};
	self.onBeforeSend = self.options.onBeforeSend || function(query, formElement, formName) {};
	self.onResponse = self.options.onResponse || function(data, onlyValidate, ajaxform) {};
	self.onValidate = self.options.onValidate || function(data, onlyValidate, ajaxform) {};

	var onInputChanged = function(e, finished) {
		self.onInputChanged(e, finished);
	};
	var onInputChangedFinished = function(e) {
		self.onInputChanged(e, true);
	};
	var onInputChangedDelayed = function(e) {
		self.onInputChanged(e, false);
	};
	var onFormSubmit = function(e) {
		if (self.submitButton === undefined) {
			self.submitButton = self.submits[0];
		}
		self.onFormSubmit(e);
		self.submitButton = undefined;
	};

	var setSubmitButton = function() {
		self.submitButton = this;
	};

	var registerInput = function(input) {
		var idx = self.inputs.indexOf(input);
		if (idx !== -1) {
			return;
		}
		self.inputs.push(input);
		_.bindEvent(input, 'change', onInputChangedFinished);
		if (self.options.liveValidate) {
			if (input.oninput === undefined) {
				_.bindEvent(input, 'keyup', onInputChangedDelayed);
			}
			else {
				_.bindEvent(input, 'input', onInputChangedDelayed);
			}
		}
	};

	var unregisterInput = function(input) {
		var idx = self.inputs.indexOf(input);
		if (idx === -1) {
			return;
		}
		self.inputs.splice(idx, 1);
		_.unbindEvent(input, 'change', onInputChangedFinished);
		if (self.options.liveValidate) {
			if (input.oninput === undefined) {
				_.unbindEvent(input, 'keyup', onInputChanged);
			}
			else {
				_.unbindEvent(input, 'input', onInputChanged);
			}
		}
	};

	var registerSubmit = function(submit) {
		var idx = self.submits.indexOf(submit);
		if (idx !== -1) {
			return;
		}
		self.submits.push(submit);
		_.bindEvent(submit, 'click', setSubmitButton);
	};

	var unregisterSubmit = function(submit) {
		var idx = self.submits.indexOf(submit);
		if (idx === -1) {
			return;
		}
		self.submits.splice(idx, 1);
		_.unbindEvent(submit, 'click', setSubmitButton);
	};

	var submitForm = function(onlyValidate) {
		var data = self.getFormData();
		if (onlyValidate) {
			data.push([self.options.onlyValidateField], '1');
		}
		if (self.submitButton !== undefined && self.submitButton.name) {
			data.push([self.submitButton.name, self.submitButton.value]);
		}

		if (onlyValidate) {
			self.onBeforeValidate(data, formElement, self.options.formName);
		}
		else {
			self.onBeforeSend(data, formElement, self.options.formName);
		}

		var query = [];
		_.forEach(data, function(name_value) {
			query.push(encodeURIComponent(name_value[0]) + '=' + encodeURIComponent(name_value[1]));
		});
		query = query.join('&');

		var url = formElement.getAttribute('action');
		_.xhrSend({
			method: 'POST',
			url: url,
			data: query,
			successFn: function(data, e) {
				if (onlyValidate) {
					processFormSubmit(data, e, onlyValidate);
				}
				else {
					if (self.onFormSubmitSuccess(data, e) !== false) {
						processFormSubmit(data, e, onlyValidate);
					}
				}
			},
			failFn: function(req) {
				if (onlyValidate) {
					_.ajaxForwardError(req);
				}
				else {
					if (self.onFormSubmitFail(req) !== false) {
						_.ajaxForwardError(req);
					}
				}
			}
		});
	};

	var processFormSubmit = function(data, event, onlyValidate) {
		if (self.onResponse(data, onlyValidate, self) === false) {
			return;
		}
		if (_.has(data, 'redirect')) {
			if (_.has(_, 'pjax')) {
				_.pjax.load(data.redirect);
			}
			else {
				window.location = data.redirect;
			}
		}
		if (_.has(data, 'forms')) {
			var formData = data.forms[self.options.formName];
			if (formData === undefined) {
				return;
			}
			self.onValidate(formData, onlyValidate, self);
		}
	};

	// Register input or submit element
	self.registerElement = function(element) {
		if (element.getAttribute('type') === 'submit') {
			registerSubmit(element);
		}
		else {
			registerInput(element);
		}
	};

	// Unregister input or submit element
	self.unregisterElement = function(element) {
		if (element.getAttribute('type') === 'submit') {
			unregisterSubmit(element);
		}
		else {
			unregisterInput(element);
		}
	};

	// Get form data in array of key-value pairs
	self.getFormData = function() {
		var q = [];
		_.forEach(self.formElement.elements, function(input) {
			_.forEach(_.serializeFormElement(input), function(name_value) {
				q.push(name_value);
			});
		});
		return q;
	};

	// Get form data in dictionary (field name: value list)
	self.getFormDict = function() {
		var dct = {};
		_.forEach(self.getFormData(), function(item) {
			var key = item[0];
			var val = item[1];
			if (!_.has(dct, key)) {
				dct[key] = [];
			}
			dct[key].push(val);
		});
		return dct;
	};

	self.submit = function() {
		submitForm();
	};

	self.validate = function() {
		submitForm(true);
	};

	self.getChanges = function(initial, current) {
		var initialData = initial;
		var currentData = current || sellf.getFormDict();
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

	if (self.options.validateDelay === null) {
		validate = self.validate;
		validate.instant = function() {
			self.validate();
		};
	}
	else {
		validate = _.debounce(self.validate, self.options.validateDelay);
	}

	_.forEach(formElement.elements, self.registerElement);
	_.bindEvent(formElement, 'submit', onFormSubmit);

	return self;
};


var ajaxform = function(formElement, options) {
	var o = _.lightCopy(options);
	o.nonFieldErrorsClass = o.nonFieldErrorsClass || _.getData(formElement, 'nonFieldErrorsClass') || 'non-field-errors';
	o.fieldErrorsClass = o.fieldErrorsClass || _.getData(formElement, 'fieldErrorsClass') || 'field-errors';
	o.rowClass = o.rowClass || _.getData(formElement, 'rowClass') || 'form-row';
	if (!_.has(o, 'liveValidate')) { o.liveValidate = (_.getData(formElement, 'liveValidate') !== 'false'); }

	var self = ajaxformBase(formElement, o);
	var disabler = submitDisabler(formElement);
	var showErrorsOnFly = {__all__: true};

	var errorIdToName = function(id) {
		var match = id.match(/(id_.*)_errors/);
		if (match === null) {
			return null;
		}
		return match[1];
	};

	var checkFormRow = function(element) {
		return _.hasClass(element, o.rowClass) || element === formElement;
	};

	var getFallbackErrorContainer = function() {
		var container = _.cls(formElement, o.nonFieldErrorsClass)[0];
		if (container === undefined) {
			container = _.elem('div', {'class': o.nonFieldErrorsClass});
			if (formElement.childNodes.length) {
				formElement.insertBefore(container, formElement.childNodes[0]);
			}
			else {
				formElement.appendChild(container);
			}
		}
		return container;
	};

	self.getErrorContainer = function(fieldName, strict) {
		var container = _.id(fieldName + '_errors');
		if (strict || container !== null) {
			return container;
		}
		return getFallbackErrorContainer();
	};

	self.findFormRow = function(element) {
		return _.findParent(element, checkFormRow);
	};

	self.addErrors = function(fieldName, errorList) {
		var errorContainer = self.getErrorContainer(fieldName);
		var errorsElement = _.tag(errorContainer, 'ul')[0];
		if (errorsElement === undefined) {
			errorsElement = _.elem('ul', {'class': 'errors'});
			errorContainer.appendChild(errorsElement);
		}

		_.forEach(errorList, function(error) {
			errorsElement.appendChild(_.elem('li', {}, error.message));
		});

		var row = self.findFormRow(errorContainer);
		if (row !== null) {
			_.removeClass(row, 'no-errors');
			_.addClass(row, 'has-errors');
		}
	};

	self.setValid = function(fieldName) {
		var errorContainer = self.getErrorContainer(fieldName, true);
		if (errorContainer === null) {
			return;
		}
		var row = self.findFormRow(errorContainer);
		if (row !== null) {
			_.addClass(row, 'no-errors');
		}
	};

	self.clearStatus = function(fieldName) {
		var errorContainer = self.getErrorContainer(fieldName, true);
		if (errorContainer === null) {
			return;
		}
		errorContainer.innerHTML = '';
		var row = self.findFormRow(errorContainer);
		if (row !== null) {
			_.removeClass(row, 'has-errors');
			_.removeClass(row, 'no-errors');
		}
	};

	self.onFormSubmit = function(e) {
		self.submit();
		disabler.disable();
		e.preventDefault();
	};

	self.onFormSubmitSuccess = function(data) {
		disabler.enable();
	};

	self.onFormSubmitFail = function(response) {
		disabler.enable();
	};

	self.onValidate = function(formData, onlyValidate) {
		var key;
		self.clearStatus('__all__');
		for (key in formData.errors) {
			if (_.has(formData.errors, key)) {
				self.clearStatus(key);
			}
		}
		_.forEach(formData.valid, function(key) {
			self.clearStatus(key);
		});

		for (key in formData.errors) {
			if (_.has(formData.errors, key)) {
				if (onlyValidate && !showErrorsOnFly[key] && formData.empty.indexOf(key) !== -1) {
					continue;
				}

				var errorList = formData.errors[key];
				self.addErrors(key, errorList);
				showErrorsOnFly[key] = true;
			}
		}
		_.forEach(formData.valid, function(key) {
			self.setValid(key);
		});
	};

	return self;
};


window._utils.ajaxformBase = ajaxformBase;
window._utils.ajaxform = ajaxform;


}(_utils));
