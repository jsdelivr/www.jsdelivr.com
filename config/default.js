const { version } = require('../package.json');
const { version: assetsVersion } = require('../src/lib/assets');

module.exports = {
	server: {
		port: 4400,
		host: 'https://www.jsdelivr.com',
		blogHost: 'https://jsdelivr-blog.ghost.io',
		assetsHost: `/assets/${assetsVersion}`,
		apiDocsHost: 'https://data.jsdelivr.com',
		userAgent: `www.jsdelivr.com/${version} (https://github.com/jsdelivr/www.jsdelivr.com)`,
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Vary': 'Accept-Encoding',
			'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
		},
		blogRewrite: {
			'/2015/10/new-website-and-sri-support.html': '/blog/jsdelivr-reloaded-2017/',
			'/2015/01/keycdn-joins-jsdelivr.html': '/blog/keycdn-joins-jsdelivr/',
			'/2014/12/new-sponsor-nsone.html': '/blog/new-sponsor-nsone/',
			'/2014/12/jsdelivr-news-3.html': '/blog/jsdelivr-news-3/',
			'/2014/11/load-balancing-algorithm-open-sourced.html': '/blog/load-balancing-algorithm-open-sourced/',
			'/2014/06/public-cdn-auto-updated.html': '/blog/public-cdn-auto-updated/',
			'/2014/03/cloudflare-joins-jsdelivr.html': '/blog/cloudflare-joins-jsdelivr/',
			'/2013/12/jsdelivr-weekly-news-2.html': '/blog/jsdelivr-weekly-news-2/',
			'/2013/11/how-jsdelivr-works.html': '/blog/how-jsdelivr-works/',
			'/2013/06/jsdelivr-weekly-news.html': '/blog/jsdelivr-weekly-news/',
			'/2013/06/jsdelivr-news-new-infrastructure-and.html': '/blog/jsdelivr-news-new-infrastructure-and-more/',
			'/2013/04/how-to-handle-time-consuming-php-scripts.html': '/blog/how-to-handle-time-consuming-php-scripts/',
			'/2013/02/jpeg-optimization-tools-benchmark.html': '/blog/jpeg-optimization-tools-benchmark/',
			'/2013/01/nginx-load-balancing-basics.html': '/blog/nginx-load-balancing-basics/',
		},
	},
};
