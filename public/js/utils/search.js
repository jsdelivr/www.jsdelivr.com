var algolia = require('./algolia.js');
var parseQuery = require('./parse-query.js');

var jsDelivrIndex = algolia.initIndex('jsDelivr');

module.exports = function (queryString, page, callback) {
	var parsed = parseQuery(queryString);

	jsDelivrIndex.search(parsed.query, function (success, response) {
		var load = [];

		if (success) {
			for (var i = 0, c = response.hits.length; i < c; i++) {
				response.hits[i].selectedVersion = response.hits[i].lastversion;

				if (!response.hits[i].assets.length) {
					load.push(response.hits[i]);
				}
			}

			if (!load.length) {
				callback($.extend(true, {}, response), queryString);
			} else {
				algolia.startQueriesBatch();

				for (i = 0, c = load.length; i < c; i++) {
					algolia.addQueryInBatch('jsDelivr_assets', '', {
						hitsPerPage: 100,
						facetFilters: 'name:' + load[i].name
					});
				}

				algolia.sendQueriesBatch(function (success, content) {
					if (success) {
						for (var i = 0, c = load.length; i < c; i++) {
							load[i].assets = content.results[i].hits;
						}
					}

					callback($.extend(true, {}, response), queryString);
				});
			}
		}
	}, { hitsPerPage: 10, page: page, facetFilters: parsed.facetFilters });
};
