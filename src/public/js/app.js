require('./polyfills');

const has = require('./utils/has');
const cAbout = require('../../views/pages/about.html');
const cBecomeASponsor = require('../../views/pages/become-a-sponsor.html');
const cFeatures = require('../../views/pages/features.html');
const cIndex = require('../../views/pages/_index.html');
const cNetwork = require('../../views/pages/network.html');
const cNetworkInfographic = require('../../views/pages/network/infographic.html');
const cNewJsdelivr = require('../../views/pages/new-jsdelivr.html');
const cPackage = require('../../views/pages/_package.html');
const cSponsors = require('../../views/pages/sponsors.html');
const cStatistics = require('../../views/pages/statistics.html');
const cSri = require('../../views/pages/using-sri-with-dynamic-files.html');
const cPPCom = require('../../views/pages/privacy-policy-jsdelivr-com.html');
const cDebug = require('../../views/pages/tools/debug.html');
const cPurge = require('../../views/pages/tools/purge.html');

Ractive.DEBUG = location.hostname === 'localhost';

// Redirect from the old URL format.
if (location.pathname === '/' && location.hash) {
	location.href = '/projects/' + location.hash.substr(2);
}

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

	document.title = app.router.route.view.get('title') || 'jsDelivr - A free, fast, and reliable Open Source CDN for npm & GitHub';
	$('meta[name=description]').attr('content', app.router.route.view.get('description') || 'A free, fast, and reliable Open Source CDN for npm and GitHub with the largest network and best performance among all CDNs. Serving more than 20 billion requests per month.');

	ga('set', 'page', this.getUri());
	ga('send', 'pageview');

	return this;
};

app.router.addRoute('/', (cIndex), { qs: [ 'docs', 'limit', 'page', 'query' ] });
app.router.addRoute('/about', (cAbout));
app.router.addRoute('/become-a-sponsor', (cBecomeASponsor));
app.router.addRoute('/features', (cFeatures));
app.router.addRoute('/network', (cNetwork));
app.router.addRoute('/network/infographic', (cNetworkInfographic));
app.router.addRoute('/new-jsdelivr', (cNewJsdelivr));
app.router.addRoute('/package/:type(npm)/:scope?/:name', (cPackage), { qs: [ 'path', 'tab', 'version' ] });
app.router.addRoute('/package/:type(gh)/:user/:repo', (cPackage), { qs: [ 'path', 'tab', 'version' ] });
app.router.addRoute('/sponsors', (cSponsors));
app.router.addRoute('/statistics', (cStatistics));
app.router.addRoute('/tools/debug', (cDebug));
app.router.addRoute('/tools/purge', (cPurge));
app.router.addRoute('/using-sri-with-dynamic-files', (cSri));
app.router.addRoute('/privacy-policy-jsdelivr-com', (cPPCom));
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
