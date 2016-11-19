(function(_) {

var opts = {
	onResponse: function(data) {
		if (_.has(data, 'redirect') && _.has(_, 'pjax')) {
			_.pjax.load(data.redirect);
			return false;
		}
	}
};

var register = function(element) {
	_.forEach(_.cls(element, 'ajaxform'), function(formElement) {
		_.ajaxform(formElement, opts);
	});
};

_.onLoad(function(e) { register(e.memo); });

}(_utils));
