const _ = require('lodash');
const url = require('url');
const httpProxy = require('http-proxy');
const cookie = require('cookie');
const Cookie = require('tough-cookie').Cookie;
const harmon = require('harmon');
const srcset = require('srcset');

module.exports = (proxyHost, host) => {
	let proxy = httpProxy.createProxyServer();
	let proxyUrl = url.parse(proxyHost, false, true);
	let rewriteAttributes = [ 'action', 'href', 'link', 'src', 'srcset' ];

	proxy.on('proxyReq', (proxyReq) => {
		proxyReq.removeHeader('referer');

		// Remove Cloudflare cookies.
		if (proxyReq.getHeader('cookie')) {
			let cookies = _.omit(cookie.parse(proxyReq.getHeader('cookie')), '__cfduid');
			proxyReq.setHeader('cookie', _.map(cookies, (value, name) => cookie.serialize(name, value)).join('; '));
		}
	});

	proxy.on('proxyRes', (proxyRes) => {
		// Remove Cloudflare headers.
		delete proxyRes.headers['cf-ray'];
		delete proxyRes.headers['cf-cache-status'];
		delete proxyRes.headers['cf-railgun'];
		delete proxyRes.headers['expect-ct'];
		delete proxyRes.headers.server;

		// Remove Cloudflare cookies.
		if (proxyRes.headers['set-cookie']) {
			proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].filter((string) => {
				return Cookie.parse(string).key !== '__cfduid';
			});

			if (!proxyRes.headers['set-cookie'].length) {
				delete proxyRes.headers['set-cookie'];
			}
		}

		// Rewrite redirects.
		if (proxyRes.headers.location) {
			let location = url.parse(proxyRes.headers.location, false, true);

			if (matchesHost(location, proxyUrl.host)) {
				return proxyRes.headers.location = host + '/blog' + location.path;
			}
		}
	});

	return [
		/**
		 * Rewrite links in HTML.
		 */
		harmon([], rewriteAttributes.map((name) => {
			return {
				query: `[${name}]`,
				func (el) {
					let rewrite = (value) => {
						let link = url.parse(value, false, true);

						if (matchesHost(link, proxyUrl.host)) {
							return host + '/blog' + link.pathname;
						}

						return value;
					};

					el.getAttribute(name, (value) => {
						try {
							if (name !== 'srcset') {
								value = rewrite(value);
							} else {
								value = srcset.stringify(srcset.parse(value).map(src => (src.url = rewrite(src.url), src)));
							}

							el.setAttribute(name, value);
						} catch (e) {}
					});
				},
			};
		}), true),
		/**
		 * The main proxy middleware.
		 */
		(req, res, next) => {
			res.status(502);

			proxy.web(req, res, {
				target: proxyUrl,
				changeOrigin: true,
				protocolRewrite: 'https',
				cookieDomainRewrite: '',
				proxyTimeout: 10000,
			}, next);
		},
	];
};

function matchesHost (url, host) {
	return (!url.host && url.pathname.charAt(0) === '/') || url.host === host;
}
