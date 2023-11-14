require('./polyfills');

const _ = require('./_');
const cDocsData = require('../../views/pages/docs/data.jsdelivr.com.html');
const cDocsGP = require('../../views/pages/docs/api.globalping.io.html');

Ractive.DEBUG = location.hostname === 'localhost';

let app = {
	config: {},
};

app.router = new Ractive.Router({
	el: '#page',
	data () {
		return {
			app,
		};
	},
});

let routerDispatch = Ractive.Router.prototype.dispatch;

Ractive.Router.prototype.dispatch = function (...args) {
	routerDispatch.apply(this, args);

	if (!app.router.route.view) {
		return;
	}

	document.title = app.router.route.view.get('title') || 'jsDelivr - A free, fast, and reliable CDN for JS and open source';
	document.querySelector('meta[name=description]').setAttribute('content', app.router.route.view.get('description') || 'Optimized for JS and ESM delivery from npm and GitHub. Works with all web formats. Serving more than 150 billion requests per month.');

	return this;
};

app.router.addRoute('/docs/data.jsdelivr.com', cDocsData);
app.router.addRoute('/docs/api.globalping.io', cDocsGP);

_.onDocumentReady(() => {
	let state = {};
	let ractive = new Ractive();
	ractive.set('@shared.app', app);
	ractive.set('@shared.escape', escape);

	function escape (string) {
		string
			.replace(/</g, '\\u003c')
			.replace(/>/g, '\\u003e')
			.replace(/\u2028/g, '\\u2028')
			.replace(/\u2029/g, '\\u2029');
	}

	try {
		let shared = JSON.parse(document.querySelector('#ractive-shared').innerHTML.trim());

		if (shared) {
			Object.keys(shared).forEach((key) => {
				ractive.set(`@shared.${key}`, shared[key]);
			});
		}
	} catch (e) {}

	try {
		state = JSON.parse(document.querySelector('#ractive-data').innerHTML.trim());
	} catch (e) {}

	app.router.init({ noScroll: true, state });
});

module.exports = app;
