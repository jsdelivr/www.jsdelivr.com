var _ = require('lodash');
var Algolia = require('algolia-search');

var appLog = require('./log.js')('app');

var client = new Algolia('0UIFPQ3RGG', 'fd0fa679c0defa9861821fc129385ab5');
var jsDelivrIndex = client.initIndex('jsDelivr');
var jsDelivrAssetsIndex = client.initIndex('jsDelivr_assets');
var noQuery = [];
var db = {};

/**
 * Create an in-memory copy of the index.
 */
jsDelivrIndex.browse(0, function (error, response) {
	if (error) {
		appLog.err(response);
	} else {
		_.each(response.hits, function (project) {
			db[project.name] = project;
			project.selectedVersion = project.lastversion;

			if (!project.assets.length) {
				jsDelivrAssetsIndex.search('', function (error, response) {
					if (!error) {
						project.assets = response.hits;
					}
				}, { hitsPerPage: 100, facetFilters: 'name:' + project.name });
			}
		});

		appLog.info('In-memory copy of the index successfully created.');

		_.each(Object.keys(db).slice(0, 10), function (name) {
			noQuery.push(db[name]);
		});
	}
}, 100000);

module.exports = function (queryString, page, callback) {
	var parsed = parseQuery(queryString);
	var options = { page: page || 0 };

	if (parsed.facetFilters) {
		options.facetFilters = parsed.facetFilters;
	}

	if (!parsed.query) {
		if (!parsed.facetFilters.length) {
			// No query, no filters. We can just show the first 10 projects.
			callback(null, noQuery);
		} else {
			// Facet filters. No need to query Algolia for these.
			callback(null, _.filter(db, function (project) {
				for (var i = 0, c = parsed.facetFilters.length; i < c; i++) {
					if (project[parsed.facetFilters[i][0]] !== parsed.facetFilters[i][1]) {
						return false;
					}
				}

				return true;
			}));
		}
	} else {
		// We'll need to query Algolia.
		var facetFilters = [];

		_.each(options.facetFilters, function (filter) {
			facetFilters.push(filter[0] + ':' + filter[1]);
		});

		options.facetFilters = facetFilters.join(',');

		jsDelivrIndex.search(parsed.query, function (error, response) {
			if (error) {
				return callback(error);
			}

			_.each(response.hits, function (project) {
				project.selectedVersion = project.lastversion;

				if (!project.assets.length) {
					project.assets = db[project.name].assets;
				}
			});

			callback(null, response.hits);
		}, options);
	}
};

function parseQuery (queryString) {
	var attrsRegExp = /\s*(?:[a-z]+)\s*:\s*(?:.(?![a-z]*\s*:))*/gi;
	var queryRegExp = /^((?:(?:[^\s:]+(?![a-z]*\s*:))\s*)*)/i;
	var query = queryString.match(queryRegExp)[0].trim();
	var substr = queryString.substr(query.length);
	var filters = [];
	var match;

	while ((match = attrsRegExp.exec(substr)) !== null) {
		var temp = match[0].split(':');
		filters.push([temp[0].trim(), temp[1].trim()]);
	}

	return {
		query: query,
		facetFilters: filters
	};
}
