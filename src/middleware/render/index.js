const Ractive = require('ractive');
const path = require('path');
const fs = require('fs-extra');
const rcu = require('rcu');
const childProcess = require('child_process');

const componentCache = new Map();
let commitHash = '';

try {
	commitHash = childProcess.execSync('git log -1 "--format=%H"', { encoding: 'utf8' }).trim();
} catch (e) {
	try {
		commitHash = fs.readFileSync(__dirname + '/../../../sha.txt', 'utf8').trim();
	} catch (e) {}
}

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
			component.set('@shared.isServer', true);
			component.set('@shared.commitHash', commitHash);
			component.set('@shared.options', ctx.options);
			component.set('@shared.router', ctx.router);
			let html = component.toHtml().replace('<<RACTIVE_SERIALIZED_DATA>>', JSON.stringify(data));

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

	return new Promise(async (resolve, reject) => {
		try {
			rcu.make(template, {
				loadImport (name, innerHref, url, callback) {
					makeComponent(path.join(path.dirname(href), innerHref), options).then(callback).catch(reject);
				},
				require (module) {
					return require(path.join(options.views, path.dirname(href), module));
				},
				parseOptions: { preserveWhitespace: true, interpolate: { script: true, style: true } },
			}, resolve, reject);
		} catch (e) {
			reject(e);
		}
	});
}

