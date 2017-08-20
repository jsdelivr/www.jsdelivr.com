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

const config = require('config');
const signalExit = require('signal-exit');
const isSafePath = require('is-safe-path');
const Koa = require('koa');
const koaStatic = require('koa-static');
const koaFavicon = require('koa-favicon');
const koaResponseTime = require('koa-response-time');
const koaConditionalGet = require('koa-conditional-get');
const koaLogger = require('koa-logger');
const koaETag = require('koa-etag');
const Router = require('koa-router');

const serverConfig = config.get('server');
const stripTrailingSlash = require('./middleware/strip-trailing-slash');
const render = require('./middleware/render');
const rollup = require('./middleware/rollup');
const less = require('./middleware/less');

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
	server.use(koaLogger());
}

/**
 * Add a X-Response-Time header.
 */
server.use(koaResponseTime());

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
 * Log basic info about requests and responses.
 */
server.use(koaLogger({
	logger,
	useLevel: 'debug',
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
 * ETag support.
 */
server.use(koaConditionalGet());
server.use(koaETag());

/**
 * Set default headers.
 */
server.use(async (ctx, next) => {
	ctx.set(serverConfig.headers);
	return next();
});

router.get('/*', async (ctx) => {
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
