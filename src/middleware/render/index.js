const Ractive = require('ractive');
const path = require('path');
const fs = require('fs-extra');
const rcu = require('rcu');

const componentCache = new Map();

rcu.init(Ractive);
Ractive.DEBUG = false;
Ractive.isServer = true;

module.exports = (options) => {
	if (!options.views) {
		throw new TypeError(`Argument options.views must be a string.`);
	}

	return async (ctx, next) => {
		ctx.render = async (template, data = {}) => {
			if (!path.extname(template)) {
				template += '.html';
			}

			let Component = await getComponent(template, options);
			let component = new Component({ data: { ...data } });
			component.set('@shared.escape', escape);
			component.set('@shared.isServer', true);
			component.set('@shared.serverHost', options.serverHost);
			component.set('@shared.assetsHost', options.assetsHost);
			component.set('@shared.apiDocsHost', options.apiDocsHost);
			component.set('@shared.assetsVersion', options.assetsVersion);
			component.set('@shared.actualPath', ctx.path);
			component.set('@shared.options', ctx.options);
			component.set('@shared.router', ctx.router);
			let html = component.toHtml().replace('<<RACTIVE_SERIALIZED_DATA>>', () => escape(JSON.stringify(data)));

			component.teardown();

			return html;
		};

		await next();
	};
};

async function getComponent (href, options) {
	let cached = componentCache.get(href);

	if (!cached || (options.revalidate && await hasChangedDependency(cached.dependencies))) {
		let dependencies = [];
		cached = { Component: await makeComponent(href, options, dependencies), dependencies };
		componentCache.set(href, cached);
	}

	return cached.Component;
}

async function hasChangedDependency (dependencies) {
	let changes = await Promise.all(dependencies.map(async ({ file, mtimeMs }) => {
		let stats = await fs.statAsync(file).catch(() => null);
		return stats?.mtimeMs !== mtimeMs;
	}));

	return changes.includes(true);
}

async function makeComponent (href, options, dependencies) {
	let viewsHref = path.join(options.views, href);
	let { mtimeMs } = await fs.statAsync(viewsHref);
	let template = await fs.readFileAsync(viewsHref, 'utf8');
	dependencies.push({ file: viewsHref, mtimeMs });

	return new Promise((resolve, reject) => {
		try {
			rcu.make(template, {
				loadImport (name, innerHref, url, callback) {
					makeComponent(path.join(path.dirname(href), innerHref), options, dependencies).then(callback).catch(reject);
				},
				require (module) {
					return require(path.join(options.views, path.dirname(href), module));
				},
				parseOptions: { interpolate: { script: true, style: true }, includeLinePositions: false, stripComments: false },
			}, resolve, reject);
		} catch (e) {
			reject(e);
		}
	});
}

function escape (string = '') {
	return string
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}
