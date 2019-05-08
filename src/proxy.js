const _ = require('lodash');
const url = require('url');
const httpProxy = require('http-proxy');
const headers = require('./lib/headers');
const cookie = require('cookie');
const Cookie = require('tough-cookie').Cookie;
const harmon = require('harmon');
const srcset = require('srcset');
const cssUrlPattern = /url\(\s*(['"])((?:\\[\s\S]|(?!\1).)*)\1\s*\)|url\(((?:\\[\s\S]|[^)])*)\)/gi;

module.exports = (proxyHost, host) => {
	let proxy = httpProxy.createProxyServer();
	let proxyUrl = url.parse(proxyHost, false, true);
	let rewriteAttributes = [ 'action', 'href', 'link', 'src', 'srcset', 'style' ];

	proxy.on('proxyReq', (proxyReq, req) => {
		// Only forward standard headers.
		_.forEach(proxyReq.getHeaders(), (value, key) => {
			if (!headers.isRequestHeader(key)) {
				proxyReq.removeHeader(key);
			}
		});

		// Remove Cloudflare cookies.
		if (proxyReq.getHeader('cookie')) {
			let cookies = _.omit(cookie.parse(proxyReq.getHeader('cookie')), '__cfduid');
			proxyReq.setHeader('cookie', _.map(cookies, (value, name) => cookie.serialize(name, value)).join('; '));
		}

		proxyReq.setHeader('X-Fowarded-For', req.ip);
	});

	proxy.on('proxyRes', (proxyRes) => {
		// Only forward standard headers.
		_.forEach(proxyRes.headers, (value, key) => {
			if (!headers.isResponseHeader(key)) {
				delete proxyRes.headers[key];
			}
		});

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
							if (name === 'srcset') {
								value = srcset.stringify(srcset.parse(value).map(src => (src.url = rewrite(src.url), src)));
							} else if (name === 'style') {
								value = value.replace(cssUrlPattern, ($0, $1, $2, $3) => {
									return `url("${rewrite($2 || $3)}")`;
								});
							} else {
								value = rewrite(value);
							}

							el.setAttribute(name, value);
						} catch (e) {}
					});
				},
			};
		}), true),

		/**
		 * Fix for harmon with http-proxy@1.17.0+
		 * Harmon assumes writeHead() is called before write() which is not the case anymore - http-proxy doesn't call writeHead() at all, it's called by node code from write().
		 */
		(req, res, next) => {
			let write = res.write;

			res.write = function (...args) {
				if (!this.headersSent) {
					this.writeHead(this.statusCode);
				}

				return write.apply(this, args);
			};

			return next();
		},

		/**
		 * The main proxy middleware.
		 */
		(req, res, next) => {
			res.status(502);

			proxy.web(req, res, {
				target: proxyHost,
				changeOrigin: true,
				protocolRewrite: 'https',
				cookieDomainRewrite: '',
				cookiePathRewrite: req.baseUrl,
				proxyTimeout: 10000,
			}, next);
		},
	];
};

function matchesHost (url, host) {
	return (!url.host && url.pathname.charAt(0) === '/') || url.host === host;
}
