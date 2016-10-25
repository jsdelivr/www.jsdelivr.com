import has from './utils/has';

import cAbout from '../../views/components/about';
import cConsultationServices from '../../views/components/consultation-services';
import cCdnInAsiaAndChina from '../../views/components/features/cdn-in-asia-and-china';
import cJsdelivrCdnFeatures from '../../views/components/features/jsdelivr-cdn-features';
import cMultiCdnLoadBalancing from '../../views/components/features/multi-cdn-load-balancing';
import cNetworkMap from '../../views/components/features/network-map';
import cCustomCdn from '../../views/components/free-open-source-cdn/custom-cdn-for-open-source';
import cJavascriptCdn from '../../views/components/free-open-source-cdn/javascript-cdn';
// import cNpmCdn from '../../views/components/free-open-source-cdn/npm-cdn';
// import cWordPressCdn from '../../views/components/free-open-source-cdn/wordpress-cdn';
import cIndex from '../../views/components/index';
import cProjects from '../../views/components/projects';
import cBecomeASponsor from '../../views/components/sponsors/become-a-sponsor';
import cOurSponsors from '../../views/components/sponsors/our-sponsors';
import cStatistics from '../../views/components/statistics';
import cDebugTool from '../../views/components/tools/debug-tool';

Ractive.DEBUG = location.hostname === 'localhost';
Ractive.defaults.isolated = true;

if (!window.Promise) {
	window.Promise = Ractive.Promise;
}

let app = {
	config: {
		animateScrolling: true,
	},
	sriHashes: {},
	usedCdn: '',
};

app.router = new Ractive.Router({
	el: '#page',
	data () {
		return {
			app,
			collection: has.localStorage() && localStorage.getItem('collection') ? JSON.parse(localStorage.getItem('collection')) : [],
		};
	},
	globals: [ 'query', 'collection' ],
});

let routerDispatch = Ractive.Router.prototype.dispatch;

Ractive.Router.prototype.dispatch = function () {
	routerDispatch.apply(this, arguments);

	document.title = app.router.route.view.get('title') || 'jsDelivr - A free super-fast CDN for developers and webmasters';

	ga('set', 'page', this.getUri());
	ga('send', 'pageview');

	return this;
};

app.router.addRoute('/', Ractive.extend(cIndex), { qs: [ 'query', 'limit' ] });
app.router.addRoute('/about', Ractive.extend(cAbout));
app.router.addRoute('/consultation-services', Ractive.extend(cConsultationServices));
app.router.addRoute('/features/multi-cdn-load-balancing', Ractive.extend(cMultiCdnLoadBalancing));
app.router.addRoute('/features/jsdelivr-cdn-features', Ractive.extend(cJsdelivrCdnFeatures));
app.router.addRoute('/features/network-map', Ractive.extend(cNetworkMap));
app.router.addRoute('/features/cdn-in-asia-and-china', Ractive.extend(cCdnInAsiaAndChina));
app.router.addRoute('/free-open-source-cdn/javascript-cdn', Ractive.extend(cJavascriptCdn));
// app.router.addRoute('/free-open-source-cdn/wordpress-cdn', Ractive.extend(cWordPressCdn));
// app.router.addRoute('/free-open-source-cdn/npm-cdn', Ractive.extend(cNpmCdn));
app.router.addRoute('/free-open-source-cdn/custom-cdn-for-open-source', Ractive.extend(cCustomCdn));
app.router.addRoute('/projects/:name', Ractive.extend(cProjects));
app.router.addRoute('/sponsors/become-a-sponsor', Ractive.extend(cBecomeASponsor));
app.router.addRoute('/sponsors/our-sponsors', Ractive.extend(cOurSponsors));
app.router.addRoute('/statistics', Ractive.extend(cStatistics));
app.router.addRoute('/tools/debug-tool', Ractive.extend(cDebugTool), { hash: [ 'resultsHash' ] });
app.router.addRoute('/(.*)', () => {
	location.pathname = '/';
});

$(() => {
	app.router
		.init()
		.watchLinks()
		.watchState();

	// The affix plugin sometimes applies incorrect css on page load; scrolling fixes the problem.
	setTimeout(function () {
		scrollBy(0, 1);
		scrollBy(0, -1);
	});
});

$.fn.shuffle = function (selector) {
	return this.each(function () {
		$(this).find(selector)
			.sort(() => .5 - Math.random())
			.detach()
			.appendTo(this);
	});
};

window.app = app;
