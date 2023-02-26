const { marked } = require('marked');
const highlight	= require('highlight.js').default;

const got = require('../../lib/got');
const algoliaNode = require('../../lib/algolia-node');
const LRU = require('lru-cache');

const cache = new LRU({ max: 1000, maxAge: 24 * 60 * 60 * 1000 });
const RAW_GH_USER_CONTENT_HOST = 'https://raw.githubusercontent.com';
const ID_PREFIX = 'id-';

marked.setOptions({
	langPrefix: 'hljs language-',
	headerIds: true,
	headerPrefix: ID_PREFIX,
	highlight (code, language) {
		return highlight.getLanguage(language) ? highlight.highlightAuto(code, [ 'html', 'javascript', 'sh', 'bash' ]).value : code;
	},
});

const fetchFromGitHub = async (user, repo, version = 'HEAD') => {
	let path = `${user}/${repo}/${version}`;

	if (cache.has(path)) {
		return cache.get(path);
	}

	let request = got(`${RAW_GH_USER_CONTENT_HOST}/${path}/README.md`, { resolveBodyOnly: true }).catch(() => {
		return got(`${RAW_GH_USER_CONTENT_HOST}/${path}/README.markdown`, { resolveBodyOnly: true });
	});

	cache.set(path, request);

	return request;
};

module.exports = async (ctx) => {
	try {
		let { type, scope, name } = ctx.params;
		let readme = '';

		if (type === 'gh') {
			readme = await fetchFromGitHub(ctx.params.user, ctx.params.repo);
		} else {
			let pkg = scope ? scope + '/' + name : name;
			let meta = await algoliaNode.getObjectWithCache(pkg);

			if (meta.githubRepo) {
				readme = await fetchFromGitHub(meta.githubRepo.user, meta.githubRepo.project);
			} else if (readme && readme !== 'ERROR: No README data found!') {
				readme = meta.readme;
			}
		}

		ctx.body = marked.parse(readme);
		ctx.type = 'text/plain';
		ctx.maxAge = 24 * 60 * 60;
	} catch (error) {
		if (error?.statusCode === 404 || error?.status === 404) { // the algolia lib uses .status
			return; // 404 response
		}

		throw error;
	}
};
