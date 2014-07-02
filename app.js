var connect = require('connect');
var express = require('express');
var isBot = require('is-bot');
var Ractive = require('ractive');
var rr = require('ractive-render');

var pkg = require('./package.json');

var app = express();

/**
 * Express config
 */
app.use(connect.favicon());
app.use(connect.logger('remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));
app.use(connect.compress());
app.use(express.static('public'));
app.use(express.static('build/' + pkg.version, { maxAge: 365 * 86400000 })); // one year

app.set('view engine', 'html');
app.engine('html', rr.renderFile);

/**
 * ractive-render config
 */
rr.use('load').config({ componentsLoader: 'load', defaultLoader: 'load' });

// tell our components not to use browser specific stuff
Ractive.isServer = true;

/**
 * bot? Render on server.
 */
app.use(function (req, res, next) {
	if (!isBot(req.headers['user-agent'])) {
		return next();
	}

	app.render('components' + req.path + '.html', { wrapper: 'template.html' }, function (err, html) {
		if (err) {
			console.error(err);
			return res.send(404);
		}

		res.send(html);
	});
});

/**
 * just send a template and render on client side
 */
app.get('/*', function (req, res) {
	res.sendfile('views/template.html', function (err) {
		if (err) {
			console.error(err);
			return res.send(500);
		}
	});
});

app.listen(process.env.PORT || 4400, function () {
	console.log('Express server listening on port ', process.env.PORT || 4400);
});