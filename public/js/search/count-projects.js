var algolia = require('./algolia.js');

module.exports = function (callback) {
	if (window.localStorage) {
		var now = Date.now();
		var count = localStorage.getItem('count');
		var expires = localStorage.getItem('expires');

		if (now < expires) {
			return callback(count);
		}

		algolia.search('', function (success, response) {
			count = Math.floor(response.nbHits / 50) * 50;

			localStorage.setItem('count', count);
			localStorage.setItem('expires', now + 604800000);
			callback(count);
		}, { analytics: false });
	} else {
		algolia.search('', function (success, response) {
			callback('count', Math.floor(response.nbHits / 50) * 50);
		}, { analytics: false });
	}
};