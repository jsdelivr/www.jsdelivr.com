const _ = require('lodash');
const url = require('url');
const httpProxy = require('http-proxy');
const headers = require('./lib/headers');
const LinkHeader = require('http-link-header');
const cookie = require('cookie');
const Cookie = require('tough-cookie').Cookie;
const harmon = require('harmon');
const srcset = require('srcset');
const cssUrlPattern = /url\(\s*(['"])((?:\\[\s\S]|(?!\1).)*)\1\s*\)|url\(((?:\\[\s\S]|[^)])*)\)/gi;

module.exports = (proxyTarget, host) => {
	let proxy = httpProxy.createProxyServer();
	let proxyUrl = new URL(proxyTarget);
	let hostUrl = new URL(host);
	let rewritableUrlPattern = new RegExp(`(?:https?:)?//(?:${_.escapeRegExp(proxyUrl.host)}|${_.escapeRegExp(hostUrl.host)})[^\\s"'<>\\\\]*`, 'gi');
	let proxyHostPattern = new RegExp(_.escapeRegExp(proxyUrl.host), 'gi');
	let referralPattern = new RegExp(`ref=${_.escapeRegExp(proxyUrl.host)}`, 'gi');
	let rewrittenReferral = `ref=${hostUrl.host}`;

	let rewrite = (link, baseUrl) => {
		// A relative URL without a leading slash. No transformation needed.
		if (!link.includes('://') && !link.startsWith('/')) {
			return link.replace(referralPattern, rewrittenReferral);
		}

		let parsed = new URL(link, proxyTarget + baseUrl);

		if (matchesHost(parsed, proxyUrl.host)) {
			if (parsed.host) {
				parsed.host = hostUrl.host;
				parsed.protocol = hostUrl.protocol;
			}

			parsed.pathname = baseUrl + parsed.pathname;
		}

		if (parsed.searchParams.get('ref')?.toLowerCase() === proxyUrl.host.toLowerCase()) {
			if (parsed.host === hostUrl.host) {
				parsed.searchParams.delete('ref');
			} else {
				parsed.searchParams.set('ref', hostUrl.host);
			}
		}

		return url.format(parsed);
	};

	let rewriteAllAbsolute = (content, baseUrl) => {
		return content.replace(rewritableUrlPattern, (link) => {
			return rewrite(link, baseUrl);
		});
	};

	let rewriteContent = (content, baseUrl) => {
		return rewriteAllAbsolute(content, baseUrl).replace(proxyHostPattern, hostUrl.host);
	};

	let removeElement = (name) => {
		return {
			query: name,
			func (el) {
				el.createStream({ outer: true }).end();
			},
		};
	};

	let rewriteAttribute = (name) => {
		return {
			query: `[${name}]`,
			func (el, req) {
				el.getAttribute(name, (value) => {
					try {
						if (name === 'srcset') {
							value = srcset.stringifySrcset(srcset.parseSrcset(value).map(src => (src.url = rewrite(src.url, req.baseUrl), src)));
						} else if (name === 'style') {
							value = value.replace(cssUrlPattern, ($0, $1, $2, $3) => {
								return `url("${rewrite($2 || $3, req.baseUrl)}")`;
							});
						} else {
							value = rewrite(value, req.baseUrl);
						}

						el.setAttribute(name, value);
					} catch {}
				});
			},
		};
	};

	let rewriteElement = (name) => {
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
						} catch {
							stream.end(value);
						}
					});
			},
		};
	};

	let rewriteRegexp = (name) => {
		return {
			query: name,
			func (el, req) {
				let value = '';
				let stream = el.createStream()
					.on('error', () => stream.end())
					.on('data', chunk => value += chunk.toString())
					.on('end', () => {
						try {
							stream.end(rewriteContent(value, req.baseUrl));
						} catch {
							stream.end(value);
						}
					});
			},
		};
	};

	proxy.on('proxyReq', (proxyReq, req) => {
		// Only forward standard headers.
		_.forEach(proxyReq.getHeaders(), (value, key) => {
			if (!headers.isRequestHeader(key)) {
				proxyReq.removeHeader(key);
			}
		});

		// Upstream validators do not apply to responses transformed by this proxy.
		proxyReq.removeHeader('if-modified-since');
		proxyReq.removeHeader('if-none-match');

		if (req.bufferProxyResponse) {
			proxyReq.removeHeader('if-range');
			proxyReq.removeHeader('range');
		}

		// Remove Cloudflare cookies.
		if (proxyReq.getHeader('cookie')) {
			let cookies = _.omit(cookie.parse(proxyReq.getHeader('cookie')), '__cfduid');

			proxyReq.setHeader('cookie', _.map(cookies, (value, name) => {
				try {
					return cookie.serialize(name, value);
				} catch { /* possibly invalid cookie sent */ }
			}).join('; '));
		}

		proxyReq.setHeader('X-Forwarded-For', req.ip);
	});

	proxy.on('proxyRes', (proxyRes, req, res) => {
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

		// Rewrite link headers.
		if (proxyRes.headers.link) {
			let link = new LinkHeader();

			LinkHeader.parse(proxyRes.headers.link).refs.forEach((ref) => {
				link.set({ ...ref, uri: rewrite(ref.uri, req.baseUrl) });
			});

			proxyRes.headers.link = link.toString();
		}

		// Rewrite redirects.
		if (proxyRes.headers.location) {
			proxyRes.headers.location = rewrite(proxyRes.headers.location, req.baseUrl);
		}

		if (req.bufferProxyResponse) {
			let chunks = [];

			proxyRes.on('data', chunk => chunks.push(chunk));
			proxyRes.on('error', error => res.destroy(error));

			proxyRes.on('end', () => {
				let body = Buffer.concat(chunks);

				if (shouldRewriteResponseBody(proxyRes.headers['content-type'])) {
					body = Buffer.from(rewriteContent(body.toString('utf8'), req.baseUrl));
					delete proxyRes.headers['content-md5'];
					delete proxyRes.headers.etag;
				}

				delete proxyRes.headers.connection;
				delete proxyRes.headers['transfer-encoding'];
				proxyRes.headers['content-length'] = body.length;

				if (proxyRes.headers['set-cookie']) {
					proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map((value) => {
						return value
							.replace(/;\s*domain=[^;]+/i, '')
							.replace(/(;\s*path=)[^;]+/i, `$1${req.baseUrl}`);
					});
				}

				res.statusCode = proxyRes.statusCode;
				res.statusMessage = proxyRes.statusMessage;
				_.forEach(proxyRes.headers, (value, key) => res.setHeader(key, value));

				if (req.method === 'HEAD') {
					return res.end();
				}

				let offset = 0;
				let write = () => {
					if (offset === body.length) {
						return res.end();
					}

					let end = Math.min(offset + 16 * 1024, body.length);
					let chunk = body.subarray(offset, end);
					offset = end;

					return res.write(chunk, write);
				};

				write();
			});
		}
	});

	let removeElementsHTML = [ 'meta[name="robots"][content="noindex"]' ];
	let rewriteAttributesHTML = [ 'action', 'content', 'data-sodo-search', 'href', 'link', 'src', 'srcset', 'style' ];
	let rewriteElementsHTML = [ 'loc' ];
	let rewriteRegExpsHTML = [ 'script[type="application/ld+json"]' ];
	let harmonMiddlewareHTML = harmon([], removeElementsHTML.map(removeElement)
		.concat(rewriteAttributesHTML.map(rewriteAttribute))
		.concat(rewriteElementsHTML.map(rewriteElement))
		.concat(rewriteRegExpsHTML.map(rewriteRegexp)), false);

	let rewriteAttributesXSL = [ 'href' ];
	let harmonMiddlewareXSL = harmon([], rewriteAttributesXSL.map(rewriteAttribute), false);

	return [
		/**
		 * Harmon middleware should only be applied to HTML and XSL files.
		 */
		(req, res, next) => {
			let path = req.path.toLowerCase();

			if (shouldBufferResponse(path)) {
				return next();
			} else if (path.endsWith('/') || path.endsWith('.html')) {
				harmonMiddlewareHTML(req, res, next);
			} else if (path.endsWith('.xsl')) {
				harmonMiddlewareXSL(req, res, next);
			} else {
				return next();
			}
		},

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
			req.bufferProxyResponse = shouldBufferResponse(req.path);

			proxy.web(req, res, {
				target: proxyTarget,
				changeOrigin: true,
				protocolRewrite: 'https',
				cookieDomainRewrite: '',
				cookiePathRewrite: req.baseUrl,
				method: req.bufferProxyResponse && req.method === 'HEAD' ? 'GET' : undefined,
				proxyTimeout: 10000,
				selfHandleResponse: req.bufferProxyResponse,
			}, next);
		},
	];
};

function matchesHost (url, host) {
	return (!url.host && url.pathname.charAt(0) === '/') || url.host === host;
}

function shouldRewriteResponseBody (contentType = '') {
	contentType = String(contentType).toLowerCase();

	return /^(?:application|text)\/(?:[\w.-]+\+)?json(?:;|$)/.test(contentType)
		|| /^(?:application|text)\/(?:[\w.-]+\+)?xml(?:;|$)/.test(contentType);
}

function shouldBufferResponse (path = '') {
	path = path.toLowerCase();

	return path.startsWith('/ghost/api/')
		|| path.endsWith('.json')
		|| path.endsWith('.xml')
		|| path.endsWith('rss/');
}
