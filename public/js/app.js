require('./hacks/modal-zero-clipboard.js');

var cSearch = require('views/components/search.html');
var cAbout = require('views/components/about.html');
var cDebugTool = require('views/components/debug-tool.html');
var cDonate = require('views/components/donate.html');
var cFeatures = require('views/components/features.html');
var cSponsors = require('views/components/sponsors.html');
var cStats = require('views/components/stats.html');

var app = module.exports;

/** @type {Router} */
app.router = new Ractive.Router({
	el: '#page',
	data: function () {
		return {
			app: app
		};
	}
});

app.router.addRoute('/', Ractive.extend(cSearch), { qs: [ 'query', 'page', 'collection' ] });
app.router.addRoute('/about', Ractive.extend(cAbout));
app.router.addRoute('/debug-tool', Ractive.extend(cDebugTool), { hash: [ 'resultsHash' ] });
app.router.addRoute('/donate', Ractive.extend(cDonate));
app.router.addRoute('/features', Ractive.extend(cFeatures));
app.router.addRoute('/sponsors', Ractive.extend(cSponsors));
app.router.addRoute('/stats', Ractive.extend(cStats));

// 404 -> homepage
app.router.addRoute('/(.*)', function () { app.router.dispatch('/'); });

$(function () {
	ZeroClipboard.config({
		swfPath: '//cdn.jsdelivr.net/zeroclipboard/2.1.5/ZeroClipboard.swf'
	});

	app.router
		.init()
		.watchLinks()
		.watchState();

	window.app = app;
});
