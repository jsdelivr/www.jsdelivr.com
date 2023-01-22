require('./polyfills');

const _ = require('./_');
const cDocsData = require('../../views/pages/docs/data.jsdelivr.com.html');

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
app.router.addRoute('/(.*)', () => { location.href = '/'; });

_.onDocumentReady(() => {
	let state = {};
	let ractive = new Ractive();
	ractive.set('@shared.app', app);

	let unescape = (string) => {
		return string
			.replace(/&gt;/g, '>')
			.replace(/&lt;/g, '<')
			.replace(/&amp;/g, '&');
	};

	try {
		let shared = JSON.parse(unescape(document.querySelector('#ractive-shared').innerHTML.trim()));

		if (shared) {
			Object.keys(shared).forEach((key) => {
				ractive.set(`@shared.${key}`, shared[key]);
			});
		}
	} catch (e) {}

	try {
		state = JSON.parse(unescape(document.querySelector('#ractive-data').innerHTML.trim()));
	} catch (e) {}

	app.router.init({ noScroll: true, state });
});

module.exports = app;
