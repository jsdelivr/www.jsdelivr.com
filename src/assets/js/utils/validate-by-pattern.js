module.exports = {
	test: (value, pattern) => {
		let regex = new RegExp(pattern);

		return regex.test(value);
	},
};
