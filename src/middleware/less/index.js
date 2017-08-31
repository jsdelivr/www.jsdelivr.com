const less = require('less');
const path = require('path');
const fs = require('fs-extra');
const CleanCSS = require('clean-css');
const cssCache = new Map();

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
			return await next();
		}

		try {
			if (options.cache && ctx.query.v === options.assetsVersion) {
				ctx.set('Cache-Control', 'public, max-age=31536000');
			}

			ctx.type = 'text/css';
			ctx.body = await getCss(ctx.path.substr(prefix.length), options);
		} catch (e) {
			ctx.status = 404;
		}
	};
};

async function compileLess (file, minify) {
	return await less.render(await fs.readFileAsync(file, 'utf8'), { filename: file, strictMath: true }).then((output) => {
		return minify ? minifyCss(output.css) : output.css;
	});
}

async function getCss (file, options) {
	if (!cssCache.has(file) || !options.cache) {
		cssCache.set(file, await compileLess(path.join(options.files, path.basename(file, '.css') + '.less'), options.minify));
	}

	return cssCache.get(file);
}

function minifyCss (css) {
	return new CleanCSS({
		level: {
			1: { all: true },
		},
	}).minify(css).styles;
}
