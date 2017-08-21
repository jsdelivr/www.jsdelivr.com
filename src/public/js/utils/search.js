const algoliasearch = require('algoliasearch');
const algolia = algoliasearch('OFCNCOG2CU', 'f54e21fa3a2a0160595bb058179bfb1e', { protocol: 'https:' });
const jsDelivrIndex = algolia.initIndex('npm-search');

module.exports = (query, page = 0, hitsPerPage = 10) => {
	return Promise.resolve().then(() => {
		let options = {
			page,
			hitsPerPage,
			attributesToHighlight: [],
			attributesToRetrieve: [ 'description', 'githubRepo', 'homepage', 'keywords', 'license', 'name', 'owner', 'version' ],
		};

		return jsDelivrIndex.search(query, options).then((response) => {
			// An exact match should always come first.
			response.hits.sort((a, b) => {
				return a.name === query ? -1 : b.name === query;
			});

			return {
				response: $.extend(true, {}, response),
				query,
			};
		});
	});
};
