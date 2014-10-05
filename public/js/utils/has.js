module.exports = {
	// https://github.com/Modernizr/Modernizr/blob/924c7611c170ef2dc502582e5079507aff61e388/feature-detects/history.js
	history: function () {
		var ua = navigator.userAgent;

		if ((ua.indexOf('Android 2.') !== -1 || (ua.indexOf('Android 4.0') !== -1)) && ua.indexOf('Mobile Safari') !== -1 && ua.indexOf('Chrome') === -1) {
			return false;
		}

		return window.history && 'pushState' in window.history;
	},
	localStorage: function () {
		try {
			localStorage.setItem('localStorageTest', 1);
			localStorage.removeItem('localStorageTest');
		} catch(e) {
			return false;
		}

		return true;
	}
};
