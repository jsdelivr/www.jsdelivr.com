import express from 'express';
import compression from 'compression';
import favicon from 'serve-favicon';
import morgan from 'morgan';
// import isBot from 'is-bot';
import Ractive from 'ractive';
import rr from 'ractive-render';

import morganConfig from './config/morgan';
import dnsApi from './js/api/dns';
import statsApi from './js/api/stats';
import logger from './js/logger';
import './js/update';

let appLog = logger('app');
let app = express();

/**
 * Express config.
 */
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(morgan(morganConfig.format, morganConfig.options));
app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: 0 })); // one year = 31536000000
app.use(express.static(__dirname + '/public', { maxAge: 3600000 }));

app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', rr.renderFile);

/**
 * ractive-render config.
 */
rr.use('load').config({ componentsLoader: 'load', defaultLoader: 'load' });

// Tell our components not to use browser specific stuff.
Ractive.isServer = true;

/**
 * Private APIs used by our frontend.
 */
app.all('/api/dns', dnsApi);
app.all('/api/stats', statsApi);

// TODO
// app.all('/api/update-algolia', update);

/**
 * Render on server side if it's a bot.
 */
// TODO
/*app.use(function (req, res, next) {
	if (!isBot(req.headers['user-agent'])) {
		return next();
	}

	render(req, res);
});*/

/**
 * Just send a template and render on client side.
 */
app.all('/*', function (req, res) {
	res.sendFile(__dirname + '/views/app.html');
});

app.listen(process.env.PORT || 4400, function () {
	console.log(`Express server listening on port ${this.address().port}.`);
});

process.on('uncaughtException', function (error) {
	console.error(error, error.stack);
	appLog.crit(error);

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});
