export default {
	// https://github.com/Modernizr/Modernizr/blob/924c7611c170ef2dc502582e5079507aff61e388/feature-detects/history.js
	history () {
		let ua = navigator.userAgent;

		if ((~ua.indexOf('Android 2.') || ~ua.indexOf('Android 4.0')) && ~ua.indexOf('Mobile Safari') && !~ua.indexOf('Chrome')) {
			return false;
		}

		return window.history && 'pushState' in window.history;
	},
	localStorage () {
		try {
			localStorage.setItem('localStorageTest', 1);
			localStorage.removeItem('localStorageTest');
		} catch (e) {
			return false;
		}

		return true;
	},
};
