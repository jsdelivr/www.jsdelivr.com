import _ from 'lodash';
import Promise from 'bluebird';
import algoliaSearch from 'algoliasearch';
import algoliaConfig from '../config/algolia';
import logger from './logger';

let appLog = logger('app');
let client = algoliaSearch(algoliaConfig.appID, algoliaConfig.readAccessToken);
let jsDelivrIndex = client.initIndex('jsDelivr');
let jsDelivrAssetsIndex = client.initIndex('jsDelivr_assets');
let noQuery = [];

/**
 * Create an in-memory copy of the index and update in once an hour.
 */
export let db = {};

updateInMemoryIndex();
setInterval(updateInMemoryIndex, 3600000);

export default function (queryString, page) {
	return Promise.try(() => {
		let parsed = parseQuery(queryString);
		let options = { page: page || 0 };

		if (parsed.facetFilters) {
			options.facetFilters = parsed.facetFilters;
		}

		if (!parsed.query) {
			if (!parsed.facetFilters.length) {
				// No query, no filters. We can just show the first 10 projects.
				return noQuery;
			} else {
				// Facet filters. No need to query Algolia for these.
				return _.filter(db, function (project) {
					for (let i = 0; i < parsed.facetFilters.length; i++) {
						if (project[parsed.facetFilters[i][0]] !== parsed.facetFilters[i][1]) {
							return false;
						}
					}

					return true;
				});
			}
		}

		// We'll need to query Algolia.
		let facetFilters = [];

		_.each(options.facetFilters, (filter) => {
			facetFilters.push(`${filter[0]}:${filter[1]}`);
		});

		options.facetFilters = facetFilters.join(',');

		return jsDelivrIndex.search(parsed.query, options).then((response) => {
			_.each(response.hits, function (project) {
				project.selectedVersion = project.lastversion;

				if (!project.assets.length) {
					project.assets = db[project.name].assets;
				}
			});

			return response.hits;
		});
	});
}

const ATTR_REGEXP = /\s*(?:[a-z]+)\s*:\s*(?:.(?![a-z]*\s*:))*/gi;
const QUERY_REGEXP = /^((?:(?:[^\s:]+(?![a-z]*\s*:))\s*)*)/i;

function parseQuery (queryString) {
	let query = queryString.match(QUERY_REGEXP)[0].trim();
	let substr = queryString.substr(query.length);
	let filters = [];
	let match;

	while ((match = ATTR_REGEXP.exec(substr)) !== null) {
		let temp = match[0].split(':');
		filters.push([ temp[0].trim(), temp[1].trim() ]);
	}

	return {
		query,
		facetFilters: filters,
	};
}

function updateInMemoryIndex () {
	let index = {};
	noQuery = [];

	getAllProjects().then((projects) => {
		_.each(projects, (project) => {
			index[project.name] = project;
			project.selectedVersion = project.lastversion;

			if (!project.assets.length) {
				jsDelivrAssetsIndex.search('', { hitsPerPage: 100, facetFilters: `name:${project.name}` }).then((response) => {
					project.assets = response.hits;
				}).catch((error) => {
					appLog.err(error);
				});
			}
		});

		_.each(Object.keys(index).slice(0, 10), (name) => {
			noQuery.push(index[name]);
		});

		_.forEach(index, (value, key) => {
			db[key] = value;
		});

		appLog.info('In-memory copy of the index successfully updated.');
	}).catch((error) => {
		appLog.err(error);
	});
}

function getAllProjects (page = 0) {
	// Can't get more than 1000 projects at once.
	let hitsPerPage = 1000;

	return jsDelivrIndex.browse('', { page, hitsPerPage }).then((response) => {
		if (response.nbHits > hitsPerPage * (page + 1)) {
			return getAllProjects(page + 1).then((response2) => {
				return response.hits.concat(...response2);
			});
		}

		return response.hits;
	});
}
