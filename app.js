var compression = require('compression');
var favicon = require('serve-favicon');
var express = require('express');
var morgan = require('morgan');
var isBot = require('is-bot');
var Ractive = require('ractive');
var rr = require('ractive-render');

var render = require('./js/render.js');
var update = require('./js/update.js');

var app = express();

/**
 * Express config.
 */
// TODO: uncomment this once we have a new logo.
//app.use(favicon('public/img/favicon.ico'));
app.use(morgan(':remote-addr - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));
app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: 31536000000 })); // one year

app.set('view engine', 'html');
app.engine('html', rr.renderFile);

/**
 * ractive-render config.
 */
rr.use('load').config({ componentsLoader: 'load', defaultLoader: 'load' });

// Tell our components not to use browser specific stuff.
Ractive.isServer = true;

/**
 * Algolia updater.
 */
app.get('/update-algolia', update);

/**
 * Render on server side if it's a bot.
 */
app.use(function (req, res, next) {
	if (!isBot(req.headers['user-agent'])) {
		return next();
	}

	render(req, res);
});

/**
 * Just send a template and render on client side.
 */
app.get('/*', function (req, res) {
	res.sendFile(__dirname + '/views/app.html');
});

app.listen(process.env.PORT || 4400, function () {
	console.log('Express server listening on port %d.', process.env.PORT || 4400);
});
