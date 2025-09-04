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
const cGlobalpingNetworks = require('../../views/pages/globalping/_networks.html');
const cGlobalpingUsers = require('../../views/pages/globalping/_users.html');
const cPP = require('../../views/pages/globalping/terms.html');
const { getGlobalpingUser } = require('./utils/http');

Ractive.DEBUG = location.hostname === 'localhost';

const historyChangeMethods = [ 'pushState', 'replaceState', 'back', 'forward', 'go' ];
const historyProxy = new Proxy(history, {
	get (target, prop) {
		let value = target[prop];

		// If it's a method that changes history, wrap it to emit an event
		if (historyChangeMethods.includes(prop) && typeof value === 'function') {
			return function (...args) {
				let result = value.apply(target, args);

				// Emit historyChange event
				let event = new CustomEvent('historyChange', {
					detail: {
						method: prop,
						args,
					},
				});

				window.dispatchEvent(event);
				return result;
			};
		}

		// For all other properties/methods, return as-is
		if (typeof value === 'function') {
			return value.bind(target);
		}

		return value;
	},

	set (target, prop, value) {
		target[prop] = value;
		return true;
	},
});

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
	history: historyProxy,
});

app.router.addRoute('/', cGlobalping, { qs: [ 'location', 'measurement', 'display', 'map' ] });
app.router.addRoute('/cli', cGlobalpingCli);
app.router.addRoute('/slack', cGlobalpingSlack);
app.router.addRoute('/discord', cGlobalpingDiscord);
app.router.addRoute('/network-tools/:params?', cGlobalpingNetworkTools);
app.router.addRoute('/integrations', cGlobalpingIntegrations);
app.router.addRoute('/about-us', cGlobalpingAbout);
app.router.addRoute('/sponsors', cGlobalpingSponsors);
app.router.addRoute('/credits', cGlobalpingCredits);
app.router.addRoute('/network', cGlobalpingNetwork, { qs: [ 'filter', 'group', 'sort' ] });
app.router.addRoute('/terms', cPP);
app.router.addRoute('/terms/:currentPolicy', cPP);
app.router.addRoute('/networks/:networkName', cGlobalpingNetworks);
app.router.addRoute('/users/:username', cGlobalpingUsers, { qs: [ 'filter', 'group', 'sort' ] });

app.router.replaceQueryParam = function (name, newValue, view = this.route.view) {
	let urlSearchParams = new URLSearchParams(location.search);

	if (newValue !== null && newValue !== undefined) {
		urlSearchParams.set(name, newValue);
	} else {
		urlSearchParams.delete(name);
	}

	let queryString = urlSearchParams.size ? `?${urlSearchParams.toString()}` : '';
	let hash = location.hash || '';

	this.history.replaceState(this.history.state, document.title, `${location.pathname}${queryString}${hash}`);
	view?.set(name, newValue);
	return this;
};

app.getSignInLink = () => {
	let url = new URL('https://dash-directus.globalping.io/auth/login/github');
	url.searchParams.set('redirect', `${Ractive.sharedGet('serverHost')}/auth/callback?redirect=${encodeURIComponent(location.href)}`);
	return url.toString();
};

app.signIn = () => {
	location.href = app.getSignInLink();
};

app.signOut = () => {
	http.gpLogOut().then(() => Ractive.sharedSet('user', null));
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
