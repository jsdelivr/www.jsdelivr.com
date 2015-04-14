var countProjects = require('./count-projects.js');
var search = require('./search.js');
var has = require('./has.js');

module.exports = function (callback) {
	countProjects(function (nbProjects) {
		var hasLocalStorage = has.localStorage();
		var now = Date.now();

		if (hasLocalStorage && localStorage.getItem('randomProjectsExpires') >= now) {
			callback(JSON.parse(localStorage.getItem('randomProjects')));
		} else {
			search('', Math.floor(Math.random() * nbProjects / 10), function (response) {
				if (hasLocalStorage) {
					localStorage.setItem('randomProjects', JSON.stringify(response));
					localStorage.setItem('randomProjectsExpires', now + 604800000); // Cache for one week.
				}

				callback(response);
			});
		}
	});
};
