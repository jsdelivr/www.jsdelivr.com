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
		ctx.render = async (template, data) => {
			if (!path.extname(template)) {
				template += '.html';
			}

			let Component = await getComponent(template, options);
			let component = new Component({ data });
			component.set('@shared.escape', escape);
			component.set('@shared.isServer', true);
			component.set('@shared.serverHost', options.serverHost);
			component.set('@shared.assetsHost', options.assetsHost);
			component.set('@shared.apiDocsHost', options.apiDocsHost);
			component.set('@shared.assetsVersion', options.assetsVersion);
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
	if (!componentCache.has(href) || !options.cache) {
		componentCache.set(href, await makeComponent(href, options));
	}

	return componentCache.get(href);
}

async function makeComponent (href, options) {
	let viewsHref = path.join(options.views, href);
	let template = await fs.readFileAsync(viewsHref, 'utf8');

	return new Promise((resolve, reject) => {
		try {
			rcu.make(template, {
				loadImport (name, innerHref, url, callback) {
					makeComponent(path.join(path.dirname(href), innerHref), options).then(callback).catch(reject);
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

function escape (string) {
	return string
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}
