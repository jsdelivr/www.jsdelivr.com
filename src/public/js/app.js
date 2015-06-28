import cIndex from '../../views/components/index';
import cMultiCdnLoadBalancing from '../../views/components/features/multi-cdn-load-balancing';
import cJsdelivrCdnFeatures from '../../views/components/features/jsdelivr-cdn-features';
import cNetworkMap from '../../views/components/features/network-map';
import cCdnInAsiaAndChina from '../../views/components/features/cdn-in-asia-and-china';
import cBecomeASponsor from '../../views/components/sponsors/become-a-sponsor';
import cOurSponsors from '../../views/components/sponsors/our-sponsors';
import cDebugTool from '../../views/components/tools/debug-tool';
import cJavascriptCdn from '../../views/components/free-open-source-cdn/javascript-cdn';
import cWordPressCdn from '../../views/components/free-open-source-cdn/wordpress-cdn';
import cNpmCdn from '../../views/components/free-open-source-cdn/npm-cdn';
import cCustomCdn from '../../views/components/free-open-source-cdn/custom-cdn-for-open-source';
import cProjects from '../../views/components/projects';

Ractive.DEBUG = location.hostname === 'localhost';
Ractive.defaults.isolated = true;

if (!window.Promise) {
	window.Promise = Ractive.Promise;
}

let app = {
	config: {
		animateScrolling: true,
	},
};

app.router = new Ractive.Router({
	el: '#page',
	data () {
		return {
			app,
			collection: [],
		};
	},
	globals: [ 'query', 'collection' ],
});

app.router.addRoute('/', Ractive.extend(cIndex), { qs: [ 'query', 'limit', 'collection' ] });
app.router.addRoute('/features/multi-cdn-load-balancing', Ractive.extend(cMultiCdnLoadBalancing));
app.router.addRoute('/features/jsdelivr-cdn-features', Ractive.extend(cJsdelivrCdnFeatures));
app.router.addRoute('/features/network-map', Ractive.extend(cNetworkMap));
app.router.addRoute('/features/cdn-in-asia-and-china', Ractive.extend(cCdnInAsiaAndChina));
app.router.addRoute('/sponsors/become-a-sponsor', Ractive.extend(cBecomeASponsor));
app.router.addRoute('/sponsors/our-sponsors', Ractive.extend(cOurSponsors));
app.router.addRoute('/tools/debug-tool', Ractive.extend(cDebugTool), { hash: [ 'resultsHash' ] });
app.router.addRoute('/free-open-source-cdn/javascript-cdn', Ractive.extend(cJavascriptCdn));
app.router.addRoute('/free-open-source-cdn/wordpress-cdn', Ractive.extend(cWordPressCdn));
app.router.addRoute('/free-open-source-cdn/npm-cdn', Ractive.extend(cNpmCdn));
app.router.addRoute('/free-open-source-cdn/custom-cdn-for-open-source', Ractive.extend(cCustomCdn));
app.router.addRoute('/projects/:name', Ractive.extend(cProjects));
app.router.addRoute('/(.*)', () => {
	location.pathname = '/';
});

$(() => {
	ZeroClipboard.config({
		swfPath: '//cdn.jsdelivr.net/zeroclipboard/2.2.0/ZeroClipboard.swf'
	});

	app.router
		.init()
		.watchLinks()
		.watchState();
});

window.app = app;
