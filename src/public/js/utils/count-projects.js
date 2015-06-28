import algolia from './algolia';
import has from './has';

let jsDelivrIndex = algolia.initIndex('jsDelivr');

export default function () {
	return Promise.resolve().then(() => {
		let hasLocalStorage = has.localStorage();
		let now = Date.now();

		if (hasLocalStorage && localStorage.getItem('nbProjectsExpires') >= now) {
			return localStorage.getItem('nbProjects');
		}

		return jsDelivrIndex.search('', { analytics: false }).then((response) => {
			let nbProjects = Math.floor(response.nbHits / 50) * 50;

			if (hasLocalStorage) {
				localStorage.setItem('nbProjects', nbProjects);
				localStorage.setItem('nbProjectsExpires', now + 604800000); // Cache for one week.
			}

			return nbProjects;
		});
	});
}
