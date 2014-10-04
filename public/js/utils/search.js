var algolia = require('./algolia.js');

var attrsRegExp = /\s*(?:[a-z]+)\s*:\s*(?:.(?![a-z]*\s*:))*/gi;
var queryRegExp = /^((?:(?:[^\s:]+(?![a-z]*\s*:))\s*)*)/i;

module.exports = function (queryString, page, callback) {
	var query = queryString.match(queryRegExp)[0].trim();
	var substr = queryString.substr(query.length);
	var attrs = {};
	var match;

	// Parse attributes.
	// TODO: The new search should support this.
	while ((match = attrsRegExp.exec(substr)) !== null) {
		var temp = match[0].split(':');
		attrs[temp[0].trim()] = temp[1].trim();
	}

	algolia.search(query, function (success, response) {
		if (success) {
			// Select the last version.
			for (var i = 0, c = response.hits.length; i < c; i++) {
				response.hits[i].selectedVersion = response.hits[i].lastversion;
			}

			callback($.extend(true, {}, response), queryString);
		}
	}, { hitsPerPage: 10, page: page });
};
