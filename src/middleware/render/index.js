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
		let tree = { dependencies: [], components: [] };
		let Component = await makeComponent(href, options, tree);
		let replaced = componentCache.get(href);

		if (replaced) {
			removeExtensions(replaced.components);
		}

		cached = { Component, ...tree };
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

// Ractive.extend() registers every class in Ractive.extensions, which would keep replaced trees alive.
function removeExtensions (components) {
	let removed = new Set(components);
	let kept = Ractive.extensions.filter(Component => !removed.has(Component));
	Ractive.extensions.splice(0, Ractive.extensions.length, ...kept);
}

async function makeComponent (href, options, tree) {
	let viewsHref = path.join(options.views, href);
	let { mtimeMs } = await fs.statAsync(viewsHref);
	let template = await fs.readFileAsync(viewsHref, 'utf8');
	tree.dependencies.push({ file: viewsHref, mtimeMs });

	let Component = await new Promise((resolve, reject) => {
		try {
			rcu.make(template, {
				loadImport (name, innerHref, url, callback) {
					makeComponent(path.join(path.dirname(href), innerHref), options, tree).then(callback).catch(reject);
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

	tree.components.push(Component);
	return Component;
}

function escape (string = '') {
	return string
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}
