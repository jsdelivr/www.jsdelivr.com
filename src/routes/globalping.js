const KoaRouter = require('koa-router');
const koaElasticUtils = require('elastic-apm-utils').koa;

const globalpingSitemap = require('../middleware/sitemap/globalping');
const ogImage = require('../middleware/open-graph');

const router = new KoaRouter();

/**
 * Discord app install redirect.
 */
koaElasticUtils.addRoutes(router, [ [ '/install/discord', '/install/discord' ] ], async (ctx) => {
	ctx.status = 301;
	return ctx.redirect('https://discord.com/api/oauth2/authorize?client_id=1005192010283630649&permissions=380104617024&scope=applications.commands%20bot');
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
		ctx.body = await ctx.render('pages/globalping/terms.html', data);
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
 * Sitemap.
 */
koaElasticUtils.addRoutes(router, [
	[ '/sitemap/:page', '/sitemap/:page' ],
], globalpingSitemap);

/**
 * OG images.
 */
koaElasticUtils.addRoutes(router, [
	[ '/open-graph/image/measurement/:id', '/open-graph/image/measurement/:id' ],
], ogImage.globalping);

/**
 * Network tools pages.
 */
koaElasticUtils.addRoutes(router, [
	[ '/network-tools/:params?' ],
], async (ctx) => {
	let data;
	let { params = '' } = ctx.params;
	let splitPoint = '-from-';
	let splitPointIdx = params.indexOf(splitPoint);
	let [ testType, target ] = splitPointIdx === -1
		? params.split(splitPoint)
		: [ params.slice(0, splitPointIdx), params.slice(splitPointIdx + splitPoint.length) ];

	try {
		// check if test type is correct
		switch (testType.toLowerCase()) {
			case 'ping':
			case 'dns':
			case 'mtr':
			case 'http':
			case 'traceroute':
				data = {
					params: ctx.params.params || '',
				};

				break;

			default:
				throw new Error(`Measurement type ${testType} is incorrect!`);
		}

		// if there is -from- part in the path but no target provided by user
		if (splitPointIdx !== -1 && !target) {
			throw new Error('Target was not provided!');
		}

		ctx.body = await ctx.render('pages/globalping/network-tools.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		// TODO: 715 app call leas to Reference error: undefined
		// if (app.env === 'development') {
		// console.error(e);
		// }

		ctx.status = 301;

		// redirect conserving the target or just to default ping test page
		let newPath = target ? `ping-from-${target}` : 'ping';

		return ctx.redirect(`/network-tools/${newPath}`);
	}
});

module.exports = router;
