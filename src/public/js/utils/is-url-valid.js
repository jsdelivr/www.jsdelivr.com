module.exports = {
	test: (url) => {
		let pattern = new RegExp(
			'(?<=http[s]?:\/\/cdn.jsdelivr.net\/).*'
			, 'g'
		);
		return pattern.test(url);
	},
	getPathFromUrl: (url) => {
		try {
			let pattern = new RegExp(
				'(?<=http[s]?:\/\/cdn.jsdelivr.net).*'
				, 'g'
			);
			let res = url.match(pattern);
			return res[0];
		} catch (e) {
			return '/';
		}
	},
};
