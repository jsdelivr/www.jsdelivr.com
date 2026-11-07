const { LRUCache } = require('lru-cache');
const { npmIndex } = require('./algolia');

const cache = new LRUCache({ max: 1000, ttl: 24 * 60 * 60 * 1000 });

module.exports.getObjectWithCache = async (name) => {
	if (cache.has(name)) {
		return _.cloneDeep(cache.get(name));
	}

	let { results: [ pkg ] } = await npmIndex.getObjects([ name ]);

	if (!pkg) {
		throw Object.assign(new Error('Object not found.'), { status: 404 });
	}

	cache.set(name, pkg);

	return _.cloneDeep(pkg);
};
