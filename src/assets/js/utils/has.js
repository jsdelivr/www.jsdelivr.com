module.exports = {
	localStorage () {
		try {
			localStorage.setItem('localStorageTest', 1);
			localStorage.removeItem('localStorageTest');
		} catch {
			return false;
		}

		return true;
	},
	sessionStorage () {
		try {
			sessionStorage.setItem('sessionStorageTest', 1);
			sessionStorage.removeItem('sessionStorageTest');
		} catch {
			return false;
		}

		return true;
	},
};
