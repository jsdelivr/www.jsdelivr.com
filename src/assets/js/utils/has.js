module.exports = {
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
