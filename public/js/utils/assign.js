module.exports = function (target, sources) {
	for (var i = 1, c = arguments.length; i < c; i++) {
		var keys = Object.keys(arguments[i]);

		for (var j = 0, d = keys.length; j < d; j++) {
			if (arguments[i][keys[j]] !== undefined) {
				target[keys[j]] = arguments[i][keys[j]];
			}
		}
	}

	return target;
};
