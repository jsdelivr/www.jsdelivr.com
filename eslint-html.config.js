const { defineConfig } = require('eslint/config');
const htmlParser = require('@html-eslint/parser');

module.exports = defineConfig([
	{
		files: [
			'**/*.html',
		],
		languageOptions: {
			parser: htmlParser,
		},
	},
]);
