var cIndex = require('views/components/index.html');
var cAbout = require('views/components/about.html');
var cDebugger = require('views/components/debugger.html');
var cFaq = require('views/components/faq.html');
var cMedia = require('views/components/media.html');
var cSponsors = require('views/components/sponsors.html');

var app = module.exports;

/** @type {Router} */
app.router = new Ractive.Router({
	el: '#content',
	data: function () { return { app: app }; }
});

app.router.addRoute('/', Ractive.extend(cIndex), { qs: [ 'query', 'page', 'collectionI' ] });
app.router.addRoute('/about/', Ractive.extend(cAbout));
app.router.addRoute('/debugger/', Ractive.extend(cDebugger), { hash: [ 'results' ] });
app.router.addRoute('/faq/', Ractive.extend(cFaq));
app.router.addRoute('/media/', Ractive.extend(cMedia));
app.router.addRoute('/sponsors/', Ractive.extend(cSponsors));
app.router.addRoute('/(.*)', function () { app.router.dispatch('/'); });

$(function () {
	ZeroClipboard.config({
		swfPath: '//cdn.jsdelivr.net/zeroclipboard/2.1.1/ZeroClipboard.swf'
	});

	app.router
		.init()
		.watchLinks()
		.watchState();

	window.app = app;
});