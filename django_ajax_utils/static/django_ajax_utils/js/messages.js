(function(_) {

var message = function(element, options) {
	var self = {};
	var opts = options || {};
	opts = _.lightCopy(opts);
	opts.autoclose = opts.autoclose || _.getData(element, 'autoclose');

	self.element = element;

	self.close = function() {
		if (opts.animateClose) {
			_.addClass(element, 'closing');
			setTimeout(removeElement, opts.animateClose);
		}
		else {
			removeElement();
		}
	};

	var onCloseClicked = function(event) {
		this.parentNode.removeChild(this);
		self.close();
		event.preventDefault();
	};

	var removeElement = function() {
		if (element.parentNode !== null) {
			element.parentNode.removeChild(element);
		}
	};

	_.forEach(_.cls(element, 'close-action'), function(element) {
		_.bindEvent(element, 'click', onCloseClicked);
	});

	var interval = parseFloat(opts.autoclose, 10);
	if (!isNaN(interval)) {
		interval = Math.round(interval * 1000);
		setTimeout(self.close, interval);
	}

	return self;
};

var getOptsForElement = function(element) {
	var opts = {};
	var animateClose = parseFloat(_.getData(element, 'animateClose'), 10);
	if (!isNaN(animateClose)) {
		opts.animateClose = Math.round(animateClose * 1000);
	}
	return opts;
};

var registerMessages = function(element) {
	var opts = getOptsForElement(element);
	_.forEach(_.cls(element, 'message'), function(element) {
		message(element, opts);
	});
};

var register = function(element) {
	_.forEach(_.cls(element, 'messages-container'), function(element) {
		_.addClass(element, 'ajax');
		registerMessages(element);
	});
};


var messageConstruct = function(options) {
	var msg = _.elem('DIV', {'class': 'message'});
	var msgBox = _.elem('DIV', {'class': 'message-box ' + options.cls});
	var msgContent = _.elem('DIV', {'class': 'message-content ' + options.cls});
	if (options.messageText !== undefined) {
		var txt = document.createTextNode(options.messageText);
		msgContent.appendChild(txt);
	}
	else {
		msgContent.innerHTML = options.messageHTML;
	}
	if (options.includeClose) {
		var closeAction = _.elem('A', {'href': '#', 'aria-hidden': 'true', 'class': 'close-action'});
		closeAction.innerHTML = '&times;';
		msgContent.appendChild(closeAction);
	}
	msgBox.appendChild(msgContent);
	msg.appendChild(msgBox);
	return msg;
};


var messageShow = function(options) {
	var opts = options || {};
	opts = _.lightCopy(opts);
	opts.messageText = opts.messageText || null;
	opts.messageHTML = opts.messageHTML || null;
	opts.includeClose = opts.includeClose || true;
	opts.container = opts.container || _.id('messages_container');
	opts.cls = opts.cls || '';

	var elementOpts = getOptsForElement(opts.container);
	for (var key in elementOpts) {
		if (_.has(elementOpts, key)) {
			if (opts[key] === undefined) {
				opts[key] = elementOpts[key];
			}
		}
	}

	var messageElement = messageConstruct(opts);
	opts.container.appendChild(messageElement);
	return message(messageElement, opts);
};


_.messageShow = messageShow;

_.onLoad(function(e) { register(e.memo); });

}(_utils));
