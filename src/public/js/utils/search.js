import algolia from './algolia.js';
import parseQuery from './parse-query.js';

let jsDelivrIndex = algolia.initIndex('jsDelivr');

export default function (queryString, page = 0, hitsPerPage = 10) {
	return Promise.resolve().then(() => {
		let parsed = parseQuery(queryString);
		let options = { page, hitsPerPage };
		let promise;

		if (parsed.facetFilters) {
			options.facetFilters = parsed.facetFilters;
		}

		if (parsed.query || options.facetFilters) {
			promise = jsDelivrIndex.search(parsed.query, options);
		} else {
			promise = jsDelivrIndex.browse(options.page, hitsPerPage);
		}

		return promise.then((response) => {
			let load = [];

			response.hits.forEach((project) => {
				project.selectedVersion = project.lastversion;

				if (!project.assets.length) {
					load.push(project);
				}
			});

			if (!load.length) {
				return {
					response: $.extend(true, {}, response),
					queryString,
				};
			}

			algolia.startQueriesBatch();

			load.forEach((project) => {
				algolia.addQueryInBatch('jsDelivr_assets', '', {
					hitsPerPage: 100,
					facetFilters: `name: ${project.name}`,
				});
			});

			return algolia.sendQueriesBatch().then((content) => {
				load.forEach((project, index) => {
					project.assets = content.results[index].hits;
				});

				return {
					response: $.extend(true, {}, response),
					queryString,
				};
			});
		});
	});
}
