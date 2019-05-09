const _ = require('lodash');
const url = require('url');
const httpProxy = require('http-proxy');
const headers = require('./lib/headers');
const cookie = require('cookie');
const Cookie = require('tough-cookie').Cookie;
const harmon = require('harmon');
const srcset = require('srcset');
const cssUrlPattern = /url\(\s*(['"])((?:\\[\s\S]|(?!\1).)*)\1\s*\)|url\(((?:\\[\s\S]|[^)])*)\)/gi;

module.exports = (proxyTarget, host) => {
	let proxy = httpProxy.createProxyServer();
	let proxyUrl = url.parse(proxyTarget, false, true);
	let rewriteAttributes = [ 'action', 'href', 'link', 'src', 'srcset', 'style' ];
	let rewriteElements = [ 'loc' ];

	let rewrite = (link, baseUrl) => {
		let parsed = url.parse(link, false, true);

		if (matchesHost(parsed, proxyUrl.host)) {
			return host + baseUrl + parsed.pathname;
		}

		return link;
	};

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

	proxy.on('proxyRes', (proxyRes, req) => {
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
			proxyRes.headers.location = rewrite(proxyRes.headers.location, req.baseUrl);
		}
	});

	return [
		/**
		 * Rewrite links in HTML.
		 */
		harmon([], rewriteAttributes.map((name) => {
			return {
				query: `[${name}]`,
				func (el, req) {
					el.getAttribute(name, (value) => {
						try {
							if (name === 'srcset') {
								value = srcset.stringify(srcset.parse(value).map(src => (src.url = rewrite(src.url, req.baseUrl), src)));
							} else if (name === 'style') {
								value = value.replace(cssUrlPattern, ($0, $1, $2, $3) => {
									return `url("${rewrite($2 || $3, req.baseUrl)}")`;
								});
							} else {
								value = rewrite(value, req.baseUrl);
							}

							el.setAttribute(name, value);
						} catch (e) {}
					});
				},
			};
		}).concat(rewriteElements.map((name) => {
			return {
				query: name,
				func (el, req) {
					let value = '';
					let stream = el.createStream()
						.on('error', () => stream.end())
						.on('data', chunk => value += chunk.toString())
						.on('end', () => {
							try {
								stream.end(rewrite(value, req.baseUrl));
							} catch (e) {
								stream.end(value);
							}
						});
				},
			};
		})), true),

		/**
		 * Fix for harmon with http-proxy@1.17.0+
		 * Harmon assumes writeHead() is called before write() which is not the case anymore - http-proxy doesn't call writeHead() at all, it's called by node code from write().
		 */
		(req, res, next) => {
			let write = res.write;

			res.write = function (...args) {
				if (this.getHeader('content-type').includes('application/xml')) {
					res.isHtml = true;

					// Strip off the content length since it will change.
					res.removeHeader('Content-Length');
				}

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
				target: proxyTarget,
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
