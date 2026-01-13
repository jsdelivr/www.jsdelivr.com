const { marked } = require('marked');
const { gfmHeadingId } = require('marked-gfm-heading-id');
const { markedHighlight } = require('marked-highlight');
const highlight	= require('highlight.js').default;

const got = require('../../lib/got');
const algoliaNode = require('../../lib/algolia-node');
const { LRUCache } = require('lru-cache');

const cache = new LRUCache({ max: 1000, ttl: 24 * 60 * 60 * 1000 });
const RAW_GH_USER_CONTENT_HOST = 'https://raw.githubusercontent.com';
const JSDELIVR_HOST = 'https://cdn.jsdelivr.net';
const ID_PREFIX = 'id-';

marked.use({
	renderer: {
		table (...rows) {
			return `<div class="table-responsive"><table class="table table-striped">${rows.join('')}</table></div>`;
		},
	},
});

marked.use(gfmHeadingId({
	prefix: ID_PREFIX,
}));

marked.use(markedHighlight({
	langPrefix: 'hljs language-',
	highlight (code, language) {
		return highlight.getLanguage(language) ? highlight.highlightAuto(code, [ 'html', 'javascript', 'sh', 'bash' ]).value : code;
	},
}));

const fetchFromGitHub = async (user, repo, version = 'HEAD') => {
	let path = `${user}/${repo}/${version}`;
	let cacheKey = `gh:${path}`;

	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	let request = got(`${RAW_GH_USER_CONTENT_HOST}/${path}/README.md`, { resolveBodyOnly: true }).catch(() => {
		return got(`${RAW_GH_USER_CONTENT_HOST}/${path}/README.markdown`, { resolveBodyOnly: true });
	}).catch((error) => {
		console.error(error);
		cache.set(cacheKey, request, { ttl: 60 * 1000 });
		return '';
	});

	cache.set(cacheKey, request);

	return request;
};

const fetchFromJsDelivr = async (pkg, version) => {
	let path = `npm/${pkg}@${version}`;
	let cacheKey = `jsd:${path}`;

	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	let request = got(`${JSDELIVR_HOST}/${path}/README.md`, { resolveBodyOnly: true }).catch(() => {
		return got(`${JSDELIVR_HOST}/${path}/README.markdown`, { resolveBodyOnly: true });
	}).catch((error) => {
		console.error(error);
		cache.set(cacheKey, request, { ttl: 60 * 1000 });
		return '';
	});

	cache.set(cacheKey, request);

	return request;
};

module.exports = async (ctx) => {
	try {
		let { type, scope, name, version } = ctx.params;
		let readme = '';

		if (type === 'gh') {
			readme = await fetchFromGitHub(ctx.params.user, ctx.params.repo, version);
		} else {
			let pkg = scope ? scope + '/' + name : name;
			let meta = await algoliaNode.getObjectWithCache(pkg);
			readme = await fetchFromJsDelivr(pkg, version || meta.version);

			if (!readme && meta.githubRepo) {
				readme = await fetchFromGitHub(meta.githubRepo.user, meta.githubRepo.project);
			}

			if (!readme && meta.readme && meta.readme !== 'ERROR: No README data found!') {
				readme = meta.readme;
			}
		}

		ctx.body = marked.parse(readme);
		ctx.type = 'text/plain';
		ctx.maxAge = readme ? 24 * 60 * 60 : 60;
	} catch (error) {
		if (error?.statusCode === 404 || error?.status === 404) { // the algolia lib uses .status
			return; // 404 response
		}

		throw error;
	}
};
