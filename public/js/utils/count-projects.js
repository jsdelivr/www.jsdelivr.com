var algolia = require('./algolia.js');
var has = require('./has.js');

var jsDelivrIndex = algolia.initIndex('jsDelivr');

module.exports = function (callback) {
	var hasLocalStorage = has.localStorage();
	var now = Date.now();

	if (hasLocalStorage && localStorage.getItem('nbProjectsExpires') >= now) {
		callback(localStorage.getItem('nbProjects'))
	} else {
		jsDelivrIndex.search('', function (success, response) {
			var nbPojects = Math.floor(response.nbHits / 50) * 50;

			if (hasLocalStorage) {
				localStorage.setItem('nbProjects', nbPojects);
				localStorage.setItem('nbProjectsExpires', now + 604800000); // Cache for one week.
			}

			callback(nbPojects);
		}, { analytics: false });
	}
};
