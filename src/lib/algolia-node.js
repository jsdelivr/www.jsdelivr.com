const LRU = require('lru-cache');
const { npmIndex } = require('./algolia');

const cache = new LRU({ max: 1000, maxAge: 24 * 60 * 60 * 1000 });

module.exports.getObjectWithCache = async (name) => {
	if (cache.has(name)) {
		return cache.get(name);
	}

	let pkg = await npmIndex.getObject(name);

	cache.set(name, pkg);

	return pkg;
};
