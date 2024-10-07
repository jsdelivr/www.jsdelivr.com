require('./polyfills');

const _ = require('./_');
const cDocsData = require('../../views/pages/docs/data.jsdelivr.com.html');
const cDocsGP = require('../../views/pages/globalping/docs/api.globalping.io.html');

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

	app.router.init({ noScroll: true, state }).watchState();

	// open navbar dropdowns on hover
	$(document)
		.on('mouseenter', '.navbar .dropdown', e => setTimeout(() => $(e.target).closest('.navbar-collapse').css('position') !== 'absolute' && $(e.target).closest('.dropdown:not(.open)').find('.dropdown-toggle').dropdown('toggle')))
		.on('mouseleave', '.navbar .dropdown', e => setTimeout(() => $(e.target).closest('.navbar-collapse').css('position') !== 'absolute' && $(e.target).closest('.dropdown.open').find('.dropdown-toggle').dropdown('toggle')));
});

module.exports = app;
