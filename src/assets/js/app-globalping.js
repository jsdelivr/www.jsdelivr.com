require('./polyfills');

const http = require('./utils/http');

const _ = require('./_');
const cGlobalping = require('../../views/pages/globalping.html');
const cGlobalpingCli = require('../../views/pages/globalping/cli.html');
const cGlobalpingSlack = require('../../views/pages/globalping/slack.html');
const cGlobalpingNetworkTools = require('../../views/pages/globalping/network-tools.html');
const cGlobalpingIntegrations = require('../../views/pages/globalping/integrations.html');

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
	globals: [ 'query', 'collection' ],
});

app.router.addRoute('/globalping', cGlobalping, { qs: [ 'measurement' ] });
app.router.addRoute('/globalping/cli', cGlobalpingCli);
app.router.addRoute('/globalping/slack', cGlobalpingSlack);
app.router.addRoute('/globalping/network-tools/:params?', cGlobalpingNetworkTools);
app.router.addRoute('/globalping/integrations', cGlobalpingIntegrations);

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
