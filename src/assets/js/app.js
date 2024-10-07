require('./polyfills');

const http = require('./utils/http');

const _ = require('./_');
const has = require('./utils/has');
const cAbout = require('../../views/pages/about.html');
const cGithub = require('../../views/pages/github.html');
const cFoundationCdn = require('../../views/pages/foundationcdn.html');
const cUnpkg = require('../../views/pages/unpkg.html');
const cGoogle = require('../../views/pages/google.html');
const cBecomeASponsor = require('../../views/pages/become-a-sponsor.html');
const cIndex = require('../../views/pages/_index.html');
const cNetwork = require('../../views/pages/network.html');
const cNetworkInfographic = require('../../views/pages/network/infographic.html');
const cNewJsdelivr = require('../../views/pages/new-jsdelivr.html');
const cPackage = require('../../views/pages/_package.html');
const cSponsors = require('../../views/pages/sponsors.html');
const cStatistics = require('../../views/pages/statistics.html');
const cSri = require('../../views/pages/using-sri-with-dynamic-files.html');
const cPP = require('../../views/pages/terms.html');
const cPurge = require('../../views/pages/tools/purge.html');
const cEsm = require('../../views/pages/esm.html');
const cHistory = require('../../views/pages/history.html');
const cGsap = require('../../views/pages/gsap.html');
const cSkypack = require('../../views/pages/skypack.html');
const cEsmsh = require('../../views/pages/esmsh.html');
const cCustomCdnOss = require('../../views/pages/oss-cdn.html');
const cCustomCdnOssProject = require('../../views/pages/_oss-cdn-project.html');
const cDocumentation = require('../../views/pages/documentation.html');

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

app.router.addRoute('/', cIndex, { qs: [ 'docs', 'limit', 'page', 'query', 'type', 'style' ] });
app.router.addRoute('/esm', cEsm);
app.router.addRoute('/about', cAbout);
app.router.addRoute('/rawgit', () => { location.href = '/'; });
app.router.addRoute('/features', () => { location.href = '/'; });
app.router.addRoute('/github', cGithub);
app.router.addRoute('/foundationcdn', cFoundationCdn);
app.router.addRoute('/unpkg', cUnpkg);
app.router.addRoute('/google', cGoogle);
app.router.addRoute('/become-a-sponsor', cBecomeASponsor);
app.router.addRoute('/network', cNetwork);
app.router.addRoute('/network/infographic', cNetworkInfographic);
app.router.addRoute('/new-jsdelivr', cNewJsdelivr);
app.router.addRoute('/package/:type(npm)/:scope?/:name', cPackage, { qs: [ 'path', 'tab', 'version', 'slide' ] });
app.router.addRoute('/package/:type(gh)/:user/:repo', cPackage, { qs: [ 'path', 'tab', 'version', 'slide' ] });
app.router.addRoute('/sponsors', cSponsors);
app.router.addRoute('/statistics', cStatistics);
app.router.addRoute('/tools/purge', cPurge);
app.router.addRoute('/using-sri-with-dynamic-files', cSri);
app.router.addRoute('/terms', cPP);
app.router.addRoute('/terms/:currentPolicy', cPP);
app.router.addRoute('/history', cHistory);
app.router.addRoute('/gsap', cGsap);
app.router.addRoute('/skypack', cSkypack);
app.router.addRoute('/esmsh', cEsmsh);
app.router.addRoute('/oss-cdn', cCustomCdnOss);
app.router.addRoute('/oss-cdn/:name', cCustomCdnOssProject);
app.router.addRoute('/documentation', cDocumentation);

app.router.addRoute('/(.*)', (route) => {
	if (!route?.data?.title?.toLowerCase().includes('not found')) {
		throw new Error('reload');
	}
});

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

		http.fetchListStatPeriods().then((response) => {
			ractive.set('@shared.rawListStatPeriods', response);
		});
	} catch (e) {}

	try {
		state = JSON.parse(document.querySelector('#ractive-data').innerHTML.trim());
	} catch (e) {}

	app.router
		.init({ noScroll: true, state: { ...state, ...app.router.data() } })
		.watchLinks()
		.watchState();
});

app.injectGlobalStyle = (href) => {
	for (let link of document.getElementsByTagName('link')) {
		if (link.href === href) {
			return;
		}
	}

	let link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = href;
	document.head.appendChild(link);
};

module.exports = app;
