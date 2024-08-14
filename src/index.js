// This needs to run before any require() call.
global.apmClient = require('elastic-apm-node').start({});
global.apmClient.addTransactionFilter(require('elastic-apm-utils').apm.transactionFilter());
require('./lib/startup');

const _ = require('lodash');
const config = require('config');
const signalExit = require('signal-exit');
const isSafePath = require('is-safe-path');
const express = require('express');
const zlib = require('zlib');

const Koa = require('koa');
const koaStatic = require('koa-static');
const koaFavicon = require('koa-favicon');
const koaLivereload = require('koa-livereload');
const koaResponseTime = require('koa-response-time');
// const koaConditionalGet = require('koa-conditional-get');
const koaCompress = require('koa-compress');
const koaLogger = require('koa-logger');
const koaETag = require('koa-etag');
const KoaRouter = require('koa-router');
const koaElasticUtils = require('elastic-apm-utils').koa;
const proxy = require('./proxy');
const assetsVersion = require('./lib/assets').version;

const serverConfig = config.get('server');
const stripTrailingSlash = require('./middleware/strip-trailing-slash');
const render = require('./middleware/render');
const sitemap = require('./middleware/sitemap');
const globalpingSitemap = require('./middleware/sitemap/globalping');
const ogImage = require('./middleware/open-graph');
const readme = require('./middleware/readme');
const debugHandler = require('./routes/debug');
const algoliaNode = require('./lib/algolia-node');
const legacyMapping = require('../data/legacy-mapping.json');
const isRenderPreview = process.env.IS_PULL_REQUEST === 'true' && process.env.RENDER_EXTERNAL_URL;

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
 * Set default headers.
 */
app.use(async (ctx, next) => {
	ctx.set(serverConfig.headers);
	return next();
});

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
app.use(koaCompress({ br: { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } } }));

/**
 * ETag support.
 */
// app.use(koaConditionalGet());
app.use(koaETag());

/**
 * Security: prevent directory traversal.
 */
app.use(async (ctx, next) => {
	if (isSafePath(ctx.path) && ctx.path.charAt(1) !== '/') {
		return next();
	}

	ctx.status = 403;
});

/**
 * Livereload support during development.
 */
if (app.env === 'development') {
	app.use(koaLivereload());
}

/**
 * Normalize URLs.
 */
app.use(stripTrailingSlash());

/**
 * Easier caching.
 */
app.use(async (ctx, next) => {
	await next();

	if (!ctx.res.allowCaching) {
		return;
	}

	if (!ctx.maxAge && ctx.status === 301) {
		ctx.maxAge = 24 * 60 * 60;
	}

	if (ctx.maxAge) {
		ctx.set('Cache-Control', `public, max-age=${ctx.maxAge}, must-revalidate, stale-while-revalidate=600, stale-if-error=86400`);
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
	cache: app.env !== 'development',
	serverHost: app.env === 'production'
		? isRenderPreview
			? process.env.RENDER_EXTERNAL_URL
			: serverConfig.host
		: '',
	assetsHost: app.env === 'production'
		? isRenderPreview
			? `${process.env.RENDER_EXTERNAL_URL}/assets/${assetsVersion}`
			: serverConfig.assetsHost
		: `/assets/${assetsVersion}`,
	apiDocsHost: serverConfig.apiDocsHost,
	globalpingApiDocsHost: serverConfig.globalpingApiDocsHost,
	assetsVersion,
}, app));

/**
 * Redirect old URLs #1.
 */
app.use(async (ctx, next) => {
	if (!ctx.query._escaped_fragment_) {
		return next();
	}

	let name = ctx.query._escaped_fragment_.trim();

	if (Object.hasOwn(legacyMapping, name)) {
		ctx.status = 301;
		return ctx.redirect(`/package/${legacyMapping[name].type}/${legacyMapping[name].name}`);
	}
});

/**
 * More accurate APM route names.
 */
router.use(koaElasticUtils.middleware(global.apmClient));

/**
 * Static files.
 */
router.use(
	'/assets/:v',
	async (ctx, next) => {
		ctx.set('X-Robots-Tag', 'noindex');

		ctx.originalPath = ctx.path;
		ctx.path = ctx.path.replace(/^\/[^/]+\/[^/]+/, '') || '/';

		if (app.env === 'production' && ctx.params.v === assetsVersion) {
			ctx.res.allowCaching = true;
		}

		return next();
	},
	koaStatic(__dirname + '/../dist/assets', {
		index: false,
		maxage: 365 * 24 * 60 * 60 * 1000,
		setHeaders (res) {
			if (res.allowCaching) {
				res.set('Cache-Control', 'public, max-age=31536000');
			} else {
				res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
			}
		},
	}),
	async (ctx) => {
		ctx.path = ctx.originalPath;
		// return next();
	},
);

router.use(koaStatic(__dirname + '/../dist', {
	index: false,
	maxage: 60 * 60 * 1000,
	setHeaders (res) {
		res.set('Cache-Control', 'public, max-age=3600');
	},
}));

router.use(async (ctx, next) => {
	ctx.res.allowCaching = ctx.res.allowCaching || (app.env === 'production' && !ctx.query.v);
	return next();
});

/**
 * Canonical links
 */
router.use(async (ctx, next) => {
	await next();

	if (ctx.status < 300) {
		ctx.append('Link', `<${serverConfig.host}${ctx.path}>; rel="canonical"`);
	}
});

/**
 * Redirect old URLs #2.
 */
koaElasticUtils.addRoutes(router, [
	[ '/projects/:name', '/projects/:name' ],
], async (ctx) => {
	if (Object.hasOwn(legacyMapping, ctx.params.name)) {
		ctx.status = 301;
		return ctx.redirect(`/package/${legacyMapping[ctx.params.name].type}/${legacyMapping[ctx.params.name].name}`);
	}
});

/**
 * Additional redirects
 */
koaElasticUtils.addRoutes(router, [
	[ '/acceptable-use-policy-jsdelivr-net', '/acceptable-use-policy-jsdelivr-net' ],
	[ '/privacy-policy-jsdelivr-com', '/privacy-policy-jsdelivr-com' ],
	[ '/privacy-policy-jsdelivr-net', '/privacy-policy-jsdelivr-net' ],
], async (ctx) => {
	ctx.status = 301;
	return ctx.redirect(`/terms${ctx.path}`);
});

koaElasticUtils.addRoutes(router, [ [ '/terms/acceptable-use-policy-jsdelivr-net' ] ], async (ctx) => {
	ctx.status = 301;
	return ctx.redirect(`/terms/terms-of-use`);
});

koaElasticUtils.addRoutes(router, [
	[ '/terms/privacy-policy-jsdelivr-com' ],
	[ '/terms/privacy-policy-jsdelivr-net' ],
], async (ctx) => {
	ctx.status = 301;
	return ctx.redirect(`/terms/privacy-policy`);
});

koaElasticUtils.addRoutes(router, [ [ '/terms/acceptable-use-policy-jsdelivr-net' ] ], async (ctx) => {
	ctx.status = 301;
	return ctx.redirect(`/terms/terms-of-use`);
});

koaElasticUtils.addRoutes(router, [ [ '/discord', '/discord' ] ], async (ctx) => {
	ctx.status = 301;
	return ctx.redirect('https://discord.gg/by8AcrjvRB');
});

koaElasticUtils.addRoutes(router, [ [ '/globalping/install/discord', '/globalping/install/discord' ] ], async (ctx) => {
	ctx.status = 301;
	return ctx.redirect('https://discord.com/api/oauth2/authorize?client_id=1005192010283630649&permissions=380104617024&scope=applications.commands%20bot');
});

/**
 * terms pages
 */
koaElasticUtils.addRoutes(router, [
	[ 'terms', '/terms/:currentPolicy' ],
], async (ctx) => {
	let data = {
		currentPolicy: ctx.params.currentPolicy,
	};

	try {
		ctx.body = await ctx.render('pages/terms.html', data);
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
 * Sitemap
 */
koaElasticUtils.addRoutes(router, [
	[ '/sitemap/:page', '/sitemap/:page' ],
], sitemap);

koaElasticUtils.addRoutes(router, [
	[ '/globalping/sitemap/:page', '/globalping/sitemap/:page' ],
], globalpingSitemap);

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
		scope: ctx.params.scope,
		actualPath: ctx.path,
		..._.pick(ctx.query, [ 'path', 'tab', 'version', 'slide' ]),
	};

	try {
		let packageFullName = data.scope ? `${data.scope}/${data.name}` : data.name;

		if (data.type === 'npm') {
			data.package = await algoliaNode.getObjectWithCache(packageFullName);
		} else {
			data.package = Object.assign({}, ctx.params, { owner: { name: data.user, avatar: data.user } });
			packageFullName = `${data.user}/${data.repo}`;
		}

		if (data.package) {
			data.description = `A free, fast, and reliable CDN for ${packageFullName}. ${data.package.description || ''}`;
			data.package.readme = ' ';
		}
	} catch {}

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
 * Custom CDN OSS pages.
 */
koaElasticUtils.addRoutes(router, [
	[ '/oss-cdn/:name', '/oss-cdn/:name' ],
], async (ctx) => {
	let data = {
		name: ctx.params.name,
		actualPath: ctx.path,
	};

	try {
		ctx.body = await ctx.render('pages/_oss-cdn-project.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (app.env === 'development') {
			console.error(e);
		}

		data.noYield = true;
		ctx.body = await ctx.render('pages/_index.html', data);
	}
});

koaElasticUtils.addRoutes(router, [
	[ '/open-graph/image/npm/:name', '/open-graph/image/:type(npm)/:scope?/:name' ],
], ogImage);

koaElasticUtils.addRoutes(router, [
	[ '/globalping/open-graph/image/measurement/:id', '/globalping/open-graph/image/measurement/:id' ],
], ogImage.globalping);

koaElasticUtils.addRoutes(router, [
	[ '/readme/npm/:name/:version', '/readme/:type(npm)/:scope(@[^/@]+)?/:name/:version?' ],
	[ '/readme/gh/:user/:repo/:version', '/readme/:type(gh)/:user/:repo/:version?' ],
], readme);

/**
 * Globalping network-tools page
 */
koaElasticUtils.addRoutes(router, [
	[ '/globalping/network-tools', '/globalping/network-tools/:params' ],
], async (ctx) => {
	let data = {
		params: ctx.params.params || '',
	};

	try {
		ctx.body = await ctx.render('pages/globalping/network-tools.html', data);
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
 * Debug endpoints.
 */
router.get('/debug/' + serverConfig.debugToken, debugHandler);
router.get('/debug/status/:status/:maxAge?/:delay?', debugHandler.status);

/**
 * All other pages.
 */
koaElasticUtils.addRoutes(router, [
	[ '/(.*)', '/(.*)' ],
], async (ctx) => {
	let data = {
		..._.pick(ctx.query, [ 'docs', 'limit', 'page', 'query', 'type', 'style', 'measurement' ]),
		actualPath: ctx.path,
	};

	try {
		ctx.body = await ctx.render('pages/' + (ctx.path === '/' ? '_index' : ctx.path === '/globalping' ? 'globalping/_index' : ctx.path) + '.html', data);
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

server.use('/blog/robots.txt', (req, res) => {
	res.set('Content-Type', 'text/plain');
	return res.send(`User-agent: *
Sitemap: ${serverConfig.host}/blog/sitemap.xml
Disallow: /ghost/
Disallow: /p/
Disallow: /email/
Disallow: /r/`);
});

/**
 * Redirect old blog posts.
 */
server.use('/blog', (req, res, next) => {
	if (Object.hasOwn(serverConfig.blogRewrite, req.path)) {
		return res.redirect(301, `${serverConfig.host}${serverConfig.blogRewrite[req.path]}`);
	} else if (req.hostname === 'blog.jsdelivr.com') {
		return res.redirect(301, `${serverConfig.host}/blog${req.path}`);
	}

	next();
});

/**
 * Proxy blog requests to ghost.
 */
server.use('/blog', proxy(serverConfig.blogHost, app.env === 'development' ? `http://localhost:${serverConfig.port}` : serverConfig.host));

/**
 * Forward everything else to Koa (main website).
 */
server.use(app.callback());

/**
 * Start listening on the configured port.
 */
server.listen(process.env.PORT || serverConfig.port, function () {
	log.info(`Web server started at http://localhost:${this.address().port}, NODE_ENV=${process.env.NODE_ENV}.`);
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
	log.fatal(`Uncaught exception. Exiting.`, error, { handled: false });

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});

process.on('unhandledRejection', (error) => {
	log.fatal('Unhandled rejection. Exiting.', error, { handled: false });

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});
