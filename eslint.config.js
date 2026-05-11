const { defineConfig } = require('eslint/config');
const javascript = require('@martin-kolarik/eslint-config');
const compat = require('eslint-plugin-compat');
const html = require('eslint-plugin-html');
const globals = require('globals');

module.exports = defineConfig([
	{
		ignores: [
			'dist/**',
		],
	},
	...javascript,
	{
		languageOptions: {
			parserOptions: {
				ecmaVersion: 2020,
			},
			globals: {
				...globals.browser,
				...globals.jquery,
				_: 'readonly',
				db: 'readonly',
				log: 'readonly',
				logger: 'readonly',
				Ractive: 'readonly',
				redis: 'readonly',
				ClipboardJS: 'readonly',
				gtag: 'readonly',
				component: 'readonly',
				Pace: 'readonly',
				google: 'readonly',
				browser: 'readonly',
				BASE_URL: 'readonly',
				perfopsRumJs: 'readonly',
				app: 'writable',
			},
		},
		plugins: {
			compat,
			html,
		},
	},
	{
		files: [
			'src/assets/**',
			'src/public/**',
			'src/views/**',
		],
		rules: {
			'compat/compat': 'error',
			'promise/catch-or-return': 'off',
		},
		settings: {
			lintAllEsApis: true,
			polyfills: [],
		},
	},
]);
