require('./polyfills');

const http = require('./utils/http');

const _ = require('./_');
const cGlobalping = require('../../views/pages/globalping/_index.html');
const cGlobalpingCli = require('../../views/pages/globalping/cli.html');
const cGlobalpingSlack = require('../../views/pages/globalping/slack.html');
const cGlobalpingDiscord = require('../../views/pages/globalping/discord.html');
const cGlobalpingNetworkTools = require('../../views/pages/globalping/network-tools.html');
const cGlobalpingIntegrations = require('../../views/pages/globalping/integrations.html');
const cGlobalpingAbout = require('../../views/pages/globalping/about-us.html');
const cGlobalpingSponsors = require('../../views/pages/globalping/sponsors.html');
const cGlobalpingCredits = require('../../views/pages/globalping/credits.html');
const cGlobalpingNetwork = require('../../views/pages/globalping/network.html');
const cGlobalpingUsers = require('../../views/pages/globalping/_users.html');
const cGlobalpingISP = require('../../views/pages/globalping/_isp.html');
const cPP = require('../../views/pages/globalping/terms.html');
const { getGlobalpingUser } = require('./utils/http');

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

app.router.addRoute('/', cGlobalping, { qs: [ 'measurement' ] });
app.router.addRoute('/cli', cGlobalpingCli);
app.router.addRoute('/slack', cGlobalpingSlack);
app.router.addRoute('/discord', cGlobalpingDiscord);
app.router.addRoute('/network-tools/:params?', cGlobalpingNetworkTools);
app.router.addRoute('/integrations', cGlobalpingIntegrations);
app.router.addRoute('/about-us', cGlobalpingAbout);
app.router.addRoute('/sponsors', cGlobalpingSponsors);
app.router.addRoute('/credits', cGlobalpingCredits);
app.router.addRoute('/network', cGlobalpingNetwork, { qs: [ 'filter' ] });
app.router.addRoute('/isp/:ispName', cGlobalpingISP);
app.router.addRoute('/terms', cPP);
app.router.addRoute('/terms/:currentPolicy', cPP);
app.router.addRoute('/users/:username', cGlobalpingUsers);


app.router.replaceQueryParam = function (name, newValue) {
	history.replaceState(history.state, null, location.href.replace(new RegExp(`${name}=[^&]+|$`), `${name}=${encodeURIComponent(newValue)}`));
	this.route.view.set(name, newValue);
	return this;
};

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

	getGlobalpingUser().then((user) => {
		ractive.set('@shared.user', user);
	});

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

	if (!document.title.includes('not found')) {
		app.router
			.init({ noScroll: true, state: { ...state, ...app.router.data() } })
			.watchLinks()
			.watchState();
	}
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
