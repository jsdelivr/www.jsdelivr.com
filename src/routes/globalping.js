const fs = require('node:fs');
const KoaRouter = require('koa-router');
const koaElasticUtils = require('elastic-apm-utils').koa;
const _ = require('lodash');

const globalpingSitemap = require('../middleware/sitemap/globalping');
const ogImage = require('../middleware/open-graph/image');
const ogMetadata = require('../middleware/open-graph/globalping');

let asnDomains = null;

try {
	asnDomains = JSON.parse(fs.readFileSync(__dirname + '/../../data/asn-domain.json', 'utf8'));
} catch (e) {
	console.error('ASN to domain name data not downloaded.');
}

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
		if (ctx.app.env === 'development') {
			console.error(e);
		}

		ctx.status = 301;
		return ctx.redirect('/');
	}
});

/**
 * Users pages
 */
koaElasticUtils.addRoutes(router, [
	[ 'users', '/users/:username' ],
], async (ctx) => {
	let users = await globalpingSitemap.getUsers();
	let username = users.find(user => user.toLowerCase() === ctx.params.username.toLowerCase());

	if (!username) {
		ctx.status = 404;
		ctx.body = await ctx.render(`pages/globalping/_404.html`, { actualPath: ctx.path });
		return;
	}

	if (username !== ctx.params.username) {
		ctx.status = 301;
		return ctx.redirect(`/users/${username}`);
	}

	let data = {
		username,
	};

	try {
		ctx.body = await ctx.render('pages/globalping/_users.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (ctx.app.env === 'development') {
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
	let isTestTypeValid = allowedTestTypes.includes(testType);

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
			newPath = target ? `ping-from-${target.toLowerCase()}` : 'ping-from-world';

			throw new Error(`Measurement type ${testType} is incorrect! Redirecting to ${newPath}!`);
		}

		ctx.body = await ctx.render('pages/globalping/network-tools.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (ctx.app.env === 'development') {
			console.error(e);
		}

		ctx.status = 301;

		return ctx.redirect(`/network-tools/${newPath}`);
	}
});

/**
 * Network pages
 */
koaElasticUtils.addRoutes(router, [
	[ '/networks/:name' ],
], async (ctx) => {
	let { name = '' } = ctx.params;

	let networks = await globalpingSitemap.getNetworks();
	let networkName = networks.find(network => network.toLowerCase() === name.toLowerCase());

	if (!networkName) {
		ctx.status = 404;
		ctx.body = await ctx.render(`pages/globalping/_404.html`, { actualPath: ctx.path });
		return;
	}

	let data = {
		networkName,
	};

	try {
		ctx.body = await ctx.render('pages/globalping/_networks.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (ctx.app.env === 'development') {
			console.error(e);
		}

		ctx.status = 301;
		return ctx.redirect('/');
	}
});

/**
 * Translate ASN to domain name (AS prefix expected)
 */
koaElasticUtils.addRoutes(router, [
	[ '/asn-to-domain/:asn' ],
], async (ctx) => {
	let { asn = '' } = ctx.params;

	if (!asn) {
		ctx.status = 400;
		return;
	}

	if (!asnDomains) {
		ctx.status = 503;
		return;
	}

	let domain = asnDomains[asn];

	if (!domain) {
		ctx.status = 404;
		return;
	}

	ctx.body = { domain };
});

/**
 * Homepage
 */
koaElasticUtils.addRoutes(router, [
	[ '/', '/' ],
], async (ctx) => {
	let path = ctx.path.startsWith('/_') ? '/_404' : ctx.path;
	let data = {
		..._.pick(ctx.query, [ 'measurement', 'map', 'display' ]),
		actualPath: ctx.path,
	};

	if (ctx.query.measurement) {
		try {
			let { title, description } = await ogMetadata(ctx);
			data._measurementOgTitle = title;
			data._measurementOgDescription = description;
		} catch (e) {
			if (ctx.app.env === 'development') {
				console.error(e);
			}
		}
	}

	try {
		ctx.body = await ctx.render(`pages/globalping/` + (path === '/' ? '_index' : path) + '.html', data);
		ctx.maxAge = 5 * 60;
	} catch (e) {
		if (ctx.app.env === 'development') {
			console.error(e);
		}

		ctx.status = 404;
		ctx.body = await ctx.render(`pages/globalping/_404.html`, { actualPath: ctx.path });
	}
});

module.exports = router;
