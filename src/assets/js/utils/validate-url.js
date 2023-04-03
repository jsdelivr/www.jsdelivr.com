module.exports = {
	test: (url) => {
		let urlPattern = new RegExp('^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$', 'i');

		return urlPattern.test(url);
	},
};
