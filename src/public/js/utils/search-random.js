import countProjects from './count-projects.js';
import search from './search.js';
import has from './has.js';

export default function () {
	return countProjects().then((nbProjects) => {
		var hasLocalStorage = has.localStorage();
		var now = Date.now();

		if (hasLocalStorage && localStorage.getItem('randomProjectsExpires') >= now) {
			return JSON.parse(localStorage.getItem('randomProjects'));
		}

		return search('', Math.floor(Math.random() * nbProjects / 10)).then((result) => {
			if (hasLocalStorage) {
				localStorage.setItem('randomProjects', JSON.stringify(result.response));
				localStorage.setItem('randomProjectsExpires', now + 604800000); // Cache for one week.
			}

			return result.response;
		});
	});
}
