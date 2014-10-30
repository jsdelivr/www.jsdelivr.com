var childProcess = require('child_process');
var crypto = require('crypto');

var _ = require('lodash');
var compression = require('compression');
var favicon = require('serve-favicon');
var express = require('express');
var morgan = require('morgan');
var isBot = require('is-bot');
var Ractive = require('ractive');
var rr = require('ractive-render');

var app = express();
var updater;

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
app.get('/updatealgolia', function (req, res) {
	var sha256 = crypto.createHash('sha256');
	sha256.update(req.query.api || '');

	if (sha256.digest('hex') !== '98d7ff35d725ea9442ce12ecad32c8c18768fd7a697ce9e78d8ff2a137403c07') {
		res.send('Invalid API key.');
	} else {
		res.send('The index will be updated.');

		if (updater) {
			console.log('Stopping the updater.');
			updater.kill();
		}

		console.log('Starting the updater.');
		updater = childProcess.fork(__dirname + '/algolia/index.js', { env: _.assign({ ALGOLIA_API_KEY: req.query.api }, process.env) });
	}

	res.status(200).end();
});

/**
 * Render on server side if it's a bot.
 */
app.use(function (req, res, next) {
	if (!isBot(req.headers['user-agent'])) {
		return next();
	}

	app.render('components' + req.path + '.html', { wrapper: 'app.html', el: 'page' }, function (err, html) {
		if (err) {
			console.error(err);
			return res.status(404).end();
		}

		res.send(html);
	});
});

/**
 * Just send a template and render on client side.
 */
app.get('/*', function (req, res) {
	res.sendFile(__dirname + '/views/app.html');
});

app.listen(process.env.PORT || 4400, function () {
	console.log('Express server listening on port ', process.env.PORT || 4400);
});
