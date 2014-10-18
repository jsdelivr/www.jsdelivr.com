require('./hacks/modal.js');

var cSearch = require('views/components/search.html');
var cAbout = require('views/components/about.html');
var cDebugTool = require('views/components/debug-tool.html');
var cDonate = require('views/components/donate.html');
var cFeatures = require('views/components/features.html');
var cProjects = require('views/components/projects.html');
var cSponsors = require('views/components/sponsors.html');
var cStats = require('views/components/stats.html');

var app = module.exports;
app.collection = [];

/** @type {Router} */
app.router = new Ractive.Router({
	el: '#page',
	data: function () {
		return {
			app: app,
			collection: app.collection
		};
	}
});

app.router.addRoute('/', Ractive.extend(cSearch), { qs: [ 'query', 'page', 'collection' ] });
app.router.addRoute('/about', Ractive.extend(cAbout));
app.router.addRoute('/debug-tool', Ractive.extend(cDebugTool), { hash: [ 'resultsHash' ] });
app.router.addRoute('/donate', Ractive.extend(cDonate));
app.router.addRoute('/features', Ractive.extend(cFeatures));
app.router.addRoute('/projects/:name', Ractive.extend(cProjects));
app.router.addRoute('/sponsors', Ractive.extend(cSponsors));
app.router.addRoute('/stats', Ractive.extend(cStats));

// 404 -> homepage
app.router.addRoute('/(.*)', function () { location.pathname = ''; });

$(function () {
	var $navbar = $('#navbar-wrapper');

	// TODO: This won't work for dynamically inserted images.
	$('.retina-image').one('load', function () {
		this.width *= .5;
	}).each(function () {
		if (this.complete) {
			$(this).trigger('load');
		}
	});

	$navbar.on('click', 'a', function () {
		$navbar.collapse('hide');
	});

	ZeroClipboard.config({
		swfPath: '//cdn.jsdelivr.net/zeroclipboard/2.1.5/ZeroClipboard.swf'
	});

	app.router
		.init()
		.watchLinks()
		.watchState();

	window.app = app;
});
