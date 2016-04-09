import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import isBot from 'is-bot';
import Ractive from 'ractive';
import ractiveLoad from 'ractive-load';
import rr from 'ractive-render';
import eh from 'express-handlebars';

import morganConfig from './config/morgan';
import dnsApi from './js/api/dns';
import mailApi from './js/api/mail';
import statsApi from './js/api/stats';
import logger from './js/logger';
import render from './js/render';
import sitemap from './js/sitemap';
import './js/update';

let appLog = logger('app');
let app = express();

/**
 * Express config.
 */
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(morgan(morganConfig.format, morganConfig.options));
app.use(compression());
app.use(express.static(__dirname + '/public', { maxAge: 3600000 }));
app.use(bodyParser.json());

app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.set('x-powered-by', false);

app.engine('html', rr.renderFile);
app.engine('xml', eh());

/**
 * ractive-render config.
 */
rr.use('load').config({ componentsLoader: 'load', defaultLoader: 'load' });
ractiveLoad.baseUrl = __dirname;

// Tell our components not to use browser specific stuff.
Ractive.isServer = true;
Ractive.DEBUG = false;

/**
 * Private APIs used by our frontend.
 */
app.all('/api/dns', dnsApi);
app.all('/api/mail', mailApi);
app.all('/api/stats', statsApi);

/**
 * sitemap.xml
 */
app.all('/sitemap.xml', sitemap);

/**
 * Make caching work correctly, as we'll be sending rendered pages for bots.
 */
app.use((req, res, next) => {
	res.vary('User-Agent');
	next();
});

/**
 * Redirect from old urls.
 */
app.use((req, res, next) => {
	if (!req.query._escaped_fragment_) {
		return next();
	}

	res.redirect(301, `/projects/${req.query._escaped_fragment_.replace(/\r|\n/g, '')}`);
});

/**
 * Render on server side if it's a bot.
 */
app.use((req, res, next) => {
	if (!isBot(req.headers['user-agent'])) {
		return next();
	}

	render(req, res);
});

/**
 * OSSCDN landing page.
 */
app.all('/osscdn', (req, res) => {
	res.sendFile(__dirname + '/views/osscdn.html');
});

/**
 * Just send a template and render on client side.
 */
app.all('/*', (req, res) => {
	res.sendFile(__dirname + '/views/app.html');
});

app.listen(process.env.PORT || 4400, function () {
	appLog.info(`Express server listening on port ${this.address().port}.`);
});

process.on('uncaughtException', (error) => {
	console.error('CRITICAL ERROR (exiting in 10 seconds):', error, error.stack);
	appLog.crit(error);

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});
