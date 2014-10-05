var algolia = require('./algolia.js');
var parseQuery = require('./parse-query.js');

module.exports = function (queryString, page, callback) {
	// TODO: The new search should support attributes.
	var parsed = parseQuery(queryString);

	algolia.search(parsed.query, function (success, response) {
		if (success) {
			// Select the last version.
			for (var i = 0, c = response.hits.length; i < c; i++) {
				response.hits[i].selectedVersion = response.hits[i].lastversion;
			}

			callback($.extend(true, {}, response), queryString);
		}
	}, { hitsPerPage: 10, page: page });
};
