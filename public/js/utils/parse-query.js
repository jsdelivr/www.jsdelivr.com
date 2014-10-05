var attrsRegExp = /\s*(?:[a-z]+)\s*:\s*(?:.(?![a-z]*\s*:))*/gi;
var queryRegExp = /^((?:(?:[^\s:]+(?![a-z]*\s*:))\s*)*)/i;

module.exports = function (queryString) {
	var query = queryString.match(queryRegExp)[0].trim();
	var substr = queryString.substr(query.length);
	var attrs = {};
	var match;

	while ((match = attrsRegExp.exec(substr)) !== null) {
		var temp = match[0].split(':');
		attrs[temp[0].trim()] = temp[1].trim();
	}

	return {
		query: query,
		attributes: attrs
	};
};
