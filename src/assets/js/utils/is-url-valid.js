module.exports = {
	test: (url) => {
		let pattern = /https?:\/\/cdn\.jsdelivr\.net\/.*/g;
		return pattern.test(url);
	},
	getPathFromUrl: (url) => {
		try {
			let pattern = /https?:\/\/cdn\.jsdelivr\.net(.*)/;
			let res = url.match(pattern);
			return res[1];
		} catch (e) {
			return '/';
		}
	},
};
