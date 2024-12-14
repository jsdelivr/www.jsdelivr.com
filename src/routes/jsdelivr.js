const KoaRouter = require('koa-router');
const koaElasticUtils = require('elastic-apm-utils').koa;

const ogImage = require('../middleware/open-graph');
const sitemap = require('../middleware/sitemap');
const readme = require('../middleware/readme');

const algoliaNode = require('../lib/algolia-node');
const legacyMapping = require('../../data/legacy-mapping.json');

const router = new KoaRouter();

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

/**
 * Terms pages
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

		ctx.status = 301;
		return ctx.redirect('/');
	}
});

/**
 * Sitemap
 */
koaElasticUtils.addRoutes(router, [
	[ '/sitemap/:page', '/sitemap/:page' ],
], sitemap);

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
 * Package readmes.
 */
koaElasticUtils.addRoutes(router, [
	[ '/readme/npm/:name/:version', '/readme/:type(npm)/:scope(@[^/@]+)?/:name/:version?' ],
	[ '/readme/gh/:user/:repo/:version', '/readme/:type(gh)/:user/:repo/:version?' ],
], readme);

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

/**
 * OG images
 */
koaElasticUtils.addRoutes(router, [
	[ '/open-graph/image/npm/:name', '/open-graph/image/:type(npm)/:scope?/:name' ],
], ogImage);

module.exports = router;
