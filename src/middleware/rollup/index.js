const path = require('path');
const rollup = require('rollup');
const rollupBabel = require('rollup-plugin-babel');
const rollupRactive = require('rollup-plugin-ractive');
const rollupCommonjs = require('rollup-plugin-commonjs');
const rollupJson = require('rollup-plugin-json');
const jsCache = new Map();

module.exports = (prefix, options) => {
	if (!prefix) {
		throw new TypeError(`Argument prefix must be a string.`);
	}

	if (!options.files) {
		throw new TypeError(`Argument options.path must be a string.`);
	}

	prefix = path.posix.join(prefix, '/');

	return async (ctx, next) => {
		if (!ctx.path.startsWith(prefix)) {
			return next();
		}

		try {
			if (options.cache && ctx.query.v === options.assetsVersion) {
				ctx.set('Cache-Control', 'public, max-age=31536000');
			} else {
				ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
			}

			ctx.type = 'application/javascript';
			ctx.body = await getJs(ctx.path.substr(prefix.length), options);
		} catch (e) {
			console.error(e);
			ctx.status = 404;
		}
	};
};

async function compileJs (file) {
	let code = await rollup.rollup({
		input: file,
		external: [
			'algoliasearch',
			'ractive',
		],
		plugins: [
			rollupRactive({ format: 'cjs', parseOptions: { interpolate: { script: true, style: true }, includeLinePositions: false } }),
			rollupCommonjs({ extensions: [ '.html', '.js' ], ignore: [ ] }),
			rollupJson(),
			rollupBabel(),
		],
	}).then(async (bundle) => {
		return (await bundle.generate({
			name: 'app',
			format: 'umd',
			globals: {
				algoliasearch: 'algoliasearch',
				ractive: 'Ractive',
			},
		})).code;
	});

	return code;
}

async function getJs (file, options) {
	if (!jsCache.has(file) || !options.cache) {
		jsCache.set(file, await compileJs(path.join(options.files, file), options.minify));
	}

	return jsCache.get(file);
}
