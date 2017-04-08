(function(_) {

var urlresolver = function(urlpatterns) {
	var self = {};

	var buildPattern = function(urlpattern, args, kwargs) {
		var pattern = urlpattern.pattern;
		var paramsRegex = [];

		_.forEach(urlpattern.params, function(param) {
			paramsRegex.push('\\%\\(' + param + '\\)s');
		});

		if (paramsRegex.length > 0) {
			pattern = pattern.split(new RegExp(paramsRegex.join('|')));
		}
		else {
			pattern = [pattern];
		}

		var finalPattern = [];
		_.forEach(pattern, function(piece) {
			finalPattern.push(piece);
			finalPattern.push(null);
		});

		if (finalPattern.length > 1) {
			finalPattern.pop();
		}

		if (args !== undefined) {
			if (args.length > urlpattern.params.length) {
				return null;
			}

			_.forEach(args, function(argument, idx) {
				finalPattern[((idx + 1) << 1) - 1] = argument;
			});
		}

		if (kwargs !== undefined) {
			for (var param in kwargs) {
				if (_.has(kwargs, param)) {
					var idx = urlpattern.params.indexOf(param);
					if (idx === -1) {
						return null;
					}
					if (finalPattern[((idx + 1) << 1) - 1] !== null) {
						return null;
					}
					finalPattern[((idx + 1) << 1) - 1] = kwargs[param];
				}
			}
		}

		if (_.some(finalPattern, function(val) { return val === null; })) {
			return null;
		}

		return '/' + finalPattern.join('');
	};

	self.reverse = function(urlName, args, kwargs) {
		if (!_.has(urlpatterns, urlName)) {
			return null;
		}

		for (var i = 0, leni = urlpatterns[urlName].length; i < leni; i++) {
			var pattern = urlpatterns[urlName][i];
			var url = buildPattern(pattern, args, kwargs);
			if (url !== null) {
				return url;
			}
		}
		return null;
	};

	return self;
};

_.urlresolver = urlresolver;

}(_utils));
