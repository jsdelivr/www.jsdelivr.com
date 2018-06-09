// This needs to run before any require() call.
global.apmClient = require('elastic-apm-node').start({
	active: process.env.NODE_ENV === 'production',
	serviceName: 'jsdelivr-website',
	serviceVersion: require('../package.json').version,
	logLevel: 'fatal',
	captureExceptions: false,
	captureSpanStackTraces: false,
	ignoreUrls: [ '/favicon.ico', '/heartbeat', '/amp_preconnect_polyfill_404_or_other_error_expected._Do_not_worry_about_it' ],
	errorOnAbortedRequests: true,
	abortedErrorThreshold: 30000,
});

require('./lib/startup');

const _ = require('lodash');
const fs = require('fs-extra');
const config = require('config');
const signalExit = require('signal-exit');
const isSafePath = require('is-safe-path');
const express = require('express');

const Koa = require('koa');
const koaStatic = require('koa-static');
const koaFavicon = require('koa-favicon');
const koaResponseTime = require('koa-response-time');
const koaConditionalGet = require('koa-conditional-get');
const koaCompress = require('koa-compress');
const koaLogger = require('koa-logger');
const koaETag = require('koa-etag');
const KoaRouter = require('koa-router');
const koaElasticUtils = require('h-logger2-elastic').koa;
const proxy = require('./proxy');

const Handlebars = require('handlebars');
const pathToPackages = require.resolve('all-the-package-names');
const assetsVersion = require('./lib/assets').version;
const readDirRecursive = require('recursive-readdir');
const path = require('path');

const serverConfig = config.get('server');
const stripTrailingSlash = require('./middleware/strip-trailing-slash');
const render = require('./middleware/render');
const rollup = require('./middleware/rollup');
const less = require('./middleware/less');
const legacyMapping = require('../data/legacy-mapping.json');
let siteMapTemplate = Handlebars.compile(fs.readFileSync(__dirname + '/views/sitemap.xml', 'utf8'));
let siteMap0Template = Handlebars.compile(fs.readFileSync(__dirname + '/views/sitemap-0.xml', 'utf8'));
let siteMapIndexTemplate = Handlebars.compile(fs.readFileSync(__dirname + '/views/sitemap-index.xml', 'utf8'));

let app = new Koa();
let router = new KoaRouter();

/**
 * Server config.
 */
app.name = serverConfig.name;
app.keys = serverConfig.keys;
app.silent = app.env === 'production';
app.proxy = true;

/**
 * Handle favicon requests before anything else.
 */
app.use(koaFavicon(__dirname + '/public/favicon.ico'));

/**
 * Log requests during development.
 */
if (app.env === 'development') {
	app.use(koaLogger({
		logger,
		useLevel: 'debug',
	}));
}

/**
 * Add a X-Response-Time header.
 */
app.use(koaResponseTime());

/**
 * Gzip compression.
 */
app.use(koaCompress());

/**
 * ETag support.
 */
app.use(koaConditionalGet());
app.use(koaETag());

/**
 * Security: prevent directory traversal.
 */
app.use(async (ctx, next) => {
	if (isSafePath(ctx.path) && ctx.path.charAt(1) !== '/') {
		return await next();
	}

	ctx.status = 403;
});

/**
 * On-demand less compilation.
 */
app.use(less('/css', {
	files: __dirname + '/public/less/',
	cache: app.env === 'production',
	minify: app.env === 'production',
	assetsVersion,
}));

/**
 * On-demand js compilation.
 */
app.use(rollup('/js', {
	files: __dirname + '/public/js/',
	cache: app.env === 'production',
	minify: app.env === 'production',
	assetsVersion,
}));

/**
 * Static files.
 */
app.use(koaStatic(__dirname + '/public', {
	maxage: 365 * 24 * 60 * 60 * 1000,
	index: false,
}));

/**
 * Normalize URLs.
 */
app.use(stripTrailingSlash());

/**
 * Easier caching.
 */
app.use(async (ctx, next) => {
	await next();

	if (ctx.maxAge) {
		ctx.set('Cache-Control', `public, max-age=${ctx.maxAge}`);
	} else if (ctx.expires) {
		ctx.set('Cache-Control', `public`);
		ctx.set('Expires', ctx.expires);
	}
});

/**
 * Ractive integration.
 */
app.use(render({
	views: __dirname + '/views/',
	cache: app.env === 'production',
	assetsVersion,
}, app));

/**
 * Set default headers.
 */
app.use(async (ctx, next) => {
	ctx.set(serverConfig.headers);
	return next();
});

/**
 * Redirect old URLs #1.
 */
app.use(async (ctx, next) => {
	if (!ctx.query._escaped_fragment_) {
		return next();
	}

	let name = ctx.query._escaped_fragment_.trim();

	if (legacyMapping.hasOwnProperty(name)) {
		ctx.status = 301;
		return ctx.redirect(`/package/${legacyMapping[name].type}/${legacyMapping[name].name}`);
	}
});

/**
 * More accurate APM route names.
 */
router.use(koaElasticUtils.middleware(global.apmClient));

/**
 * Redirect old URLs #2.
 */
koaElasticUtils.addRoutes(router, [
	[ '/projects/:name', '/projects/:name' ],
], async (ctx) => {
	if (legacyMapping.hasOwnProperty(ctx.params.name)) {
		ctx.status = 301;
		return ctx.redirect(`/package/${legacyMapping[ctx.params.name].type}/${legacyMapping[ctx.params.name].name}`);
	}
});

/**
 * Sitemap
 */
koaElasticUtils.addRoutes(router, [
	[ '/sitemap/:page', '/sitemap/:page' ],
], async (ctx) => {
	ctx.params.page = ctx.params.page.replace(/\.xml$/, '');
	let packages = JSON.parse(await fs.readFile(pathToPackages, 'utf8'));
	let pages = (await readDirRecursive(__dirname + '/views/pages', [ '_*' ])).map(p => path.relative(__dirname + '/views/pages', p).replace(/\\/g, '/').slice(0, -5));
	let maxPage = Math.ceil(packages.length / 50000);
	let page = Number(ctx.params.page);

	if (ctx.params.page === 'index') {
		ctx.body = siteMapIndexTemplate({ maps: _.range(1, maxPage) });
	} else if (page > 0 && page <= maxPage) {
		ctx.body = siteMapTemplate({ packages: packages.slice((page - 1) * 50000, page * 50000) });
	} else if (page === 0) {
		ctx.body = siteMap0Template({ pages });
	} else {
		ctx.status = 404;
	}

	ctx.type = 'xml';
	ctx.maxAge = 24 * 60 * 60;
});

/**
 * Package pages.
 */
koaElasticUtils.addRoutes(router, [
	[ '/package/npm/:name', '/package/:type(npm)/:scope?/:name' ],
	[ '/package/gh/:user/:repo', '/package/:type(gh)/:user/:repo' ],
], async (ctx) => {
	let data = {
		type: ctx.params.type,
		name: ctx.params.name,
		user: ctx.params.user,
		repo: ctx.params.repo,
		path: ctx.query.path,
		scope: ctx.params.scope,
	};

	try {
		ctx.body = await ctx.render('pages/_package.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (app.env === 'development') {
			console.error(e);
		}

		data.noYield = true;
		ctx.body = await ctx.render('pages/_index.html', data);
	}
});

/**
 * All other pages.
 */
koaElasticUtils.addRoutes(router, [
	[ '/*', '/*' ],
], async (ctx) => {
	let data = {
		docs: ctx.query.docs,
	};

	try {
		ctx.body = await ctx.render('pages/' + (ctx.path === '/' ? '_index' : ctx.path) + '.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (app.env === 'development') {
			console.error(e);
		}

		ctx.status = 301;
		return ctx.redirect('/');
	}
});

/**
 * Routing.
 */
app.use(router.routes()).use(router.allowedMethods());

/**
 * Koa error handling.
 */
app.on('error', (error, ctx) => {
	let ignore = [ 'ECONNABORTED', 'ECONNRESET', 'EPIPE' ];

	if ((error.status && error.status < 500) || ignore.includes(error.code)) {
		return;
	}

	log.error('Koa server error.', error, { ctx });
});


/**
 * Main Express server.
 */
let server = express();

server.enable('trust proxy');
server.enable('strict routing');
server.enable('case sensitive routing');
server.disable('query parser');
server.disable('x-powered-by');
server.disable('etag');

/**
 * Redirect /blog to /blog/.
 */
server.use((req, res, next) => {
	if (req.path === '/blog') {
		return res.redirect(`${req.path}/`);
	}

	next();
});

/**
 * Redirect old blog posts.
 */
server.use('/blog', (req, res, next) => {
	if (serverConfig.blogRewrite.hasOwnProperty(req.path)) {
		return res.redirect(301, `${serverConfig.host}${serverConfig.blogRewrite[req.path]}`);
	} else if (req.hostname === 'blog.jsdelivr.com') {
		return res.redirect(301, `${serverConfig.host}/blog${req.path}`);
	}

	next();
});

/**
 * Proxy blog requests to ghost.
 */
server.use('/blog', proxy(serverConfig.blogHost, app.env === 'development' ? '' : serverConfig.host));

/**
 * Forward everything else to Koa (main website).
 */
server.use(app.callback());

/**
 * Start listening on the configured port.
 */
server.listen(process.env.PORT || serverConfig.port, function () {
	log.info(`Web server started at http://localhost:${this.address().port}`);
});

/**
 * Always log before exit.
 */
signalExit((code, signal) => {
	log[code === 0 ? 'info' : 'fatal']('Web server stopped.', { code, signal });
});

/**
 * If we exit because of an uncaught exception, log the error details as well.
 */
process.on('uncaughtException', (error) => {
	log.fatal(`Uncaught exception. Exiting.`, error);

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});

process.on('unhandledRejection', (error) => {
	log.fatal('Unhandled rejection. Exiting.', error);

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});
