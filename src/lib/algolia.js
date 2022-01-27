const algoliasearch = require('algoliasearch');

let algolia = algoliasearch('OFCNCOG2CU', 'f54e21fa3a2a0160595bb058179bfb1e', { protocol: 'https:' });
let npmIndex = algolia.initIndex('npm-search');

module.exports.algolia = algolia;
module.exports.npmIndex = npmIndex;
