module.exports = {
	test: (domain) => {
		let domainNamePattern = new RegExp('^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z]{2,6}$');

		return domainNamePattern.test(domain);
	},
};
