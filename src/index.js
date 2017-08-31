// This needs to run before any require() call.
const trace = require('@risingstack/trace');
global.OPBEAT_CLIENT = require('opbeat').start({
	serverId: '45fb9abc99',
	organizationId: '091f361b83f64dbcbac3d3c318636efc',
	secretToken: process.env.OPBEAT_TOKEN,
	logLevel: 'fatal',
	active: process.env.NODE_ENV === 'production',
	captureExceptions: false,
	ignoreUrls: [ '/favicon.ico', '/heartbeat' ],
	timeoutErrorThreshold: 30000,
});

require('./lib/startup');
require('./lib/trace-cpu')(trace);

const fs = require('fs-extra');
const config = require('config');
const signalExit = require('signal-exit');
const isSafePath = require('is-safe-path');
const Koa = require('koa');
const koaStatic = require('koa-static');
const koaFavicon = require('koa-favicon');
const koaResponseTime = require('koa-response-time');
const koaConditionalGet = require('koa-conditional-get');
const koaCompress = require('koa-compress');
const koaLogger = require('koa-logger');
const koaETag = require('koa-etag');
const Router = require('koa-router');
const Handlebars = require('handlebars');
const dedent = require('dedent-js');
const pathToPackages = require.resolve('all-the-package-names');

const serverConfig = config.get('server');
const stripTrailingSlash = require('./middleware/strip-trailing-slash');
const render = require('./middleware/render');
const rollup = require('./middleware/rollup');
const less = require('./middleware/less');
const legacyMapping = require('../data/legacy-mapping.json');

const templateSource = dedent`
	<?xml version="1.0" encoding="utf-8"?>
	<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
		{{#each packages}}
			<url>
				<loc>https://www.jsdelivr.com/package/npm/{{this}}</loc>
				<changefreq>monthly</changefreq>
			</url>
		{{/each}}
	</urlset>
	`;

let siteMapTemplate = Handlebars.compile(templateSource);
let server = new Koa();
let router = new Router();

/**
 * Server config.
 */
server.name = serverConfig.name;
server.keys = serverConfig.keys;
server.silent = server.env === 'production';

/**
 * Handle favicon requests before anything else.
 */
server.use(koaFavicon(__dirname + '/public/favicon.ico'));

/**
 * Log requests during development.
 */
if (server.env === 'development') {
	server.use(koaLogger({
		logger,
		useLevel: 'debug',
	}));
}

/**
 * Add a X-Response-Time header.
 */
server.use(koaResponseTime());

/**
 * Gzip compression.
 */
server.use(koaCompress());

/**
 * ETag support.
 */
server.use(koaConditionalGet());
server.use(koaETag());

/**
 * Security: prevent directory traversal.
 */
server.use(async (ctx, next) => {
	if (isSafePath(ctx.path)) {
		return await next();
	}

	ctx.status = 403;
});

/**
 * On-demand less compilation.
 */
server.use(less('/css', {
	files: __dirname + '/public/less/',
	cache: server.env === 'production',
	minify: server.env === 'production',
}));

/**
 * On-demand js compilation.
 */
server.use(rollup('/js', {
	files: __dirname + '/public/js/',
	cache: server.env === 'production',
	minify: server.env === 'production',
}));

/**
 * Static files.
 */
server.use(koaStatic(__dirname + '/public', {
	maxage: 365 * 24 * 60 * 60 * 1000,
	index: false,
}));

/**
 * Normalize URLs.
 */
server.use(stripTrailingSlash());

/**
 * Ractive integration.
 */
server.use(render({
	views: __dirname + '/views/',
	cache: server.env === 'production',
}, server));

/**
 * Set default headers.
 */
server.use(async (ctx, next) => {
	ctx.set(serverConfig.headers);
	return next();
});

/**
 * Redirect old URLs #1.
 */
server.use(async (ctx, next) => {
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
 * Redirect old URLs #2.
 */
router.get('/projects/:name', async (ctx) => {
	if (legacyMapping.hasOwnProperty(ctx.params.name)) {
		ctx.status = 301;
		return ctx.redirect(`/package/${legacyMapping[ctx.params.name].type}/${legacyMapping[ctx.params.name].name}`);
	}
});

/**
 * Sitemap
 */
router.get('/sitemap.xml', async (ctx) => {
	ctx.body = siteMapTemplate({ packages: JSON.parse(await fs.readFile(pathToPackages, 'utf8')) });
});

/**
 * Package pages.
 */
router.get([
	'/package/:type(npm)/:name',
	'/package/:type(gh)/:user/:repo',
], async (ctx) => {
	let data = {
		type: ctx.params.type,
		name: ctx.params.name,
		user: ctx.params.user,
		repo: ctx.params.repo,
		path: ctx.query.path,
	};

	try {
		ctx.body = await ctx.render('pages/package.html', data);
	} catch (e) {
		if (server.env === 'development') {
			console.error(e);
		}

		data.noYield = true;
		ctx.body = await ctx.render('pages/index.html', data);
	}
});

/**
 * All other pages.
 */
router.get([ '/*' ], async (ctx) => {
	let data = {
		docs: ctx.query.docs,
	};

	try {
		ctx.body = await ctx.render('pages/' + (ctx.path === '/' ? 'index' : ctx.path) + '.html', data);
	} catch (e) {
		if (server.env === 'development') {
			console.error(e);
		}

		ctx.body = await ctx.render('pages/index.html', data);
	}
});

/**
 * Routing.
 */
server.use(router.routes()).use(router.allowedMethods());

/**
 * Koa error handling.
 */
server.on('error', (err, ctx) => {
	logger.error({ err, ctx }, 'Koa server error.');
});

/**
 * Start listening on the configured port.
 */
server.listen(process.env.PORT || serverConfig.port, () => {
	logger.info(`Web server started on port ${process.env.PORT || serverConfig.port}.`);
});

/**
 * Always log before exit.
 */
signalExit((code, signal) => {
	logger[code === 0 ? 'info' : 'fatal']({ code, signal }, 'Web server stopped.');
});

/**
 * If we exit because of an uncaught exception, log the error details as well.
 */
process.on('uncaughtException', (error) => {
	logger.fatal(error, `Fatal error. Exiting.`);

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});
