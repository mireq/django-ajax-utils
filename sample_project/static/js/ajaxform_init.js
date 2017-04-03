(function(_) {


var register = function(element) {
	_.forEach(_.cls(element, 'ajaxform'), _.ajaxform);
};

_.onLoad(function(e) { register(e.memo); });

}(_utils));
