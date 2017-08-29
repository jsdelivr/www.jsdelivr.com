require('./polyfills');

const has = require('./utils/has');
const cIndex = require('../../views/pages/index.html');
const cFeatures = require('../../views/pages/features.html');
const cPackage = require('../../views/pages/package.html');
const cSponsors = require('../../views/pages/sponsors.html');
const cBecomeASponsor = require('../../views/pages/become-a-sponsor.html');
const cStatistics = require('../../views/pages/statistics.html');
const cDebug = require('../../views/pages/tools/debug.html');
const cPurge = require('../../views/pages/tools/purge.html');
const cSri = require('../../views/pages/using-sri-with-dynamic-files.html');
const cNetwork = require('../../views/pages/network.html');

Ractive.DEBUG = location.hostname === 'localhost';

let app = {
	config: {
		animateScrolling: true,
	},
	usedCdn: '',
};

app.router = new Ractive.Router({
	el: '#page',
	data () {
		return {
			app,
			collection: has.localStorage() && localStorage.getItem('collection2') ? JSON.parse(localStorage.getItem('collection2')) : [],
		};
	},
	globals: [ 'query', 'collection' ],
});

let routerDispatch = Ractive.Router.prototype.dispatch;

Ractive.Router.prototype.dispatch = function () {
	routerDispatch.apply(this, arguments);

	if (!app.router.route.view) {
		return;
	}

	document.title = app.router.route.view.get('title') || 'jsDelivr - A free super-fast CDN for developers and webmasters';

	ga('set', 'page', this.getUri());
	ga('send', 'pageview');

	return this;
};

app.router.addRoute('/', (cIndex), { qs: [ 'docs', 'limit', 'page', 'query' ] });
app.router.addRoute('/package/:type(npm)/:name', (cPackage), { qs: [ 'path', 'tab', 'version' ] });
app.router.addRoute('/package/:type(gh)/:user/:repo', (cPackage), { qs: [ 'path', 'tab', 'version' ] });
app.router.addRoute('/features', (cFeatures));
app.router.addRoute('/sponsors', (cSponsors));
app.router.addRoute('/become-a-sponsor', (cBecomeASponsor));
app.router.addRoute('/statistics', (cStatistics));
app.router.addRoute('/tools/debug', (cDebug));
app.router.addRoute('/tools/purge', (cPurge));
app.router.addRoute('/using-sri-with-dynamic-files', (cSri));
app.router.addRoute('/network', (cNetwork));
app.router.addRoute('/(.*)', () => {
	location.pathname = '/';
});

$(() => {
	new Ractive().set('@shared.app', app);

	app.router
		.init({ noScroll: true })
		.watchLinks()
		.watchState();
});

module.exports = app;
