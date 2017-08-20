const algolia = algoliasearch('OFCNCOG2CU', 'f54e21fa3a2a0160595bb058179bfb1e', { protocol: 'https:' });
const jsDelivrIndex = algolia.initIndex('npm-search');

module.exports = (query, page = 0, hitsPerPage = 10) => {
	return Promise.resolve().then(() => {
		let options = { page, hitsPerPage };

		return jsDelivrIndex.search(query, options).then((response) => {
			return {
				response: $.extend(true, {}, response),
				query,
			};
		});
	});
};
