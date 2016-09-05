(function(_) {


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


var ajaxform = function(formElement, options) {
	var self = {};
	var clickedButton;
	var o = _.lightCopy(options);
	self.options = o;
	o.processDataExtra = o.processDataExtra || function(form, data, ajaxform) {};
	o.processFormStatusExtra = o.processFormStatusExtra || function(form, data, ajaxform) {}; // for captcha and etc.
	o.nonFieldErrorsClass = o.nonFieldErrorsClass || _.getData(formElement, 'nonFieldErrorsClass') || 'non-field-errors';
	o.fieldErrorsClass = o.fieldErrorsClass || _.getData(formElement, 'fieldErrorsClass') || 'field-errors';
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
		data += '&' + encodeURIComponent(o.onlyValidateField) + '=1';
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
		if (!opts.onlyValidate) {
			disabler.disable();
		}

		_.xhrSend({
			method: 'POST',
			url: url,
			data: data,
			successFn: function(data, event) {
				if (!opts.onlyValidate) {
					disabler.enable();
				}
				processFormSubmit(data, event);
			},
			failFn: function(req) {
				if (!opts.onlyValidate) {
					disabler.enable();
				}
				_.triggerEvent(formElement, 'submit_fail');
				ajaxForwardError(req);
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
	_.forEach(formElement.getElementsByTagName('BUTTON'), function(element) {
		if (element.getAttribute('type') === 'submit') {
			submits.push(element);
		}
	});
	_.forEach(formElement.getElementsByTagName('INPUT'), function(element) {
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


_.onLoad(function(e) { register(e.memo); });


}(_utils));
