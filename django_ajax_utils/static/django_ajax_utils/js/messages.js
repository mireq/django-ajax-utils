(function(_) {

var message = function(element, options) {
	var self = {};
	var opts = options || {};
	opts = _.lightCopy(opts);
	opts.autoclose = opts.autoclose || _.getData(element, 'autoclose');

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

var registerMessages = function(element) {
	var opts = {};
	var animateClose = parseFloat(_.getData(element, 'animateClose'), 10);
	if (!isNaN(animateClose)) {
		opts.animateClose = Math.round(animateClose * 1000);
	}
	_.forEach(_.cls(element, 'message'), function(element) {
		message(element, opts);
	});
};

var register = function(element) {
	_.addClass(element, 'ajax');
	_.forEach(_.cls(element, 'messages-container'), function(element) {
		registerMessages(element);
	});
};

_.onLoad(function(e) { register(e.memo); });

}(_utils));
