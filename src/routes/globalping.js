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
	[ '/network-tools', '/network-tools/:params?' ],
], async (ctx) => {
	let data;
	let newPath;
	let { params = '' } = ctx.params;
	let splitPoint = '-from-';
	let splitPointIdx = params.indexOf(splitPoint);
	let [ testType, target ] = splitPointIdx === -1
		? params.split(splitPoint)
		: [ params.slice(0, splitPointIdx), params.slice(splitPointIdx + splitPoint.length) ];
	let allowedTestTypes = [ 'ping', 'dns', 'mtr', 'http', 'traceroute' ];
	let isTestTypeValid = allowedTestTypes.includes(testType.toLowerCase());

	try {
		// check if test type is correct
		if (isTestTypeValid) {
			if (!target) {
				newPath = `${testType}-from-world`;

				throw new Error(`Redirecting to ${newPath}!`);
			}

			data = {
				params: ctx.params.params || '',
			};
		} else {
			// redirect conserving the target or just to default ping-from-world test page
			newPath = target ? `ping-from-${target}` : 'ping-from-world';

			throw new Error(`Measurement type ${testType} is incorrect! Redirecting to ${newPath}!`);
		}

		ctx.body = await ctx.render('pages/globalping/network-tools.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		// TODO: 715 app call leas to Reference error: undefined
		// if (app.env === 'development') {
		// console.error(e);
		// }
		ctx.status = 301;

		return ctx.redirect(`/network-tools/${newPath}`);
	}
});

module.exports = router;
