(function(_) {


var register = function(element) {
	_.forEach(_.cls(element, 'ajaxform'), function(formElement) {
		if (_.hasClass(formElement, 'foundation')) {
			_.ajaxformFoundation(formElement);
		}
		else {
			_.ajaxform(formElement);
		}
	});
};

_.onLoad(function(e) { register(e.memo); });

}(_utils));
