process.env.FONTCONFIG_PATH = 'fonts';

const got = require('got');
const sharp = require('sharp');
const wordwrap = require('wordwrap');
const LRU = require('lru-cache');
const { npmIndex } = require('../../lib/algolia');

const API_HOST = 'https://data.jsdelivr.com';
const LOGO_MAX_SIZE = 2 ** 20; // 1MiB

const cache = new LRU({ max: 1000, maxAge: 24 * 60 * 60 * 1000 });
const http = got.extend({ cache });

const fetchStats = async (name, type = 'npm', period = 'month') => {
	return http.get(`${API_HOST}/v1/package/${type}/${name}/stats/date/${period}`).json();
};

const fetchLogo = async (url) => {
	return new Promise((resolve, reject) => {
		let stream = http.stream.get(url);

		let size = 0;
		let mime = 'image/png';
		let logo = [];

		stream.on('end', () => {
			resolve(`data:${mime};base64,${Buffer.concat(logo).toString('base64')}`);
		});

		stream.on('error', reject);

		stream.on('response', (res) => {
			if (res.headers['content-length'] && res.headers['content-length'] > LOGO_MAX_SIZE) {
				return stream.destroy(new Error('logo size limit exited'));
			}

			mime = res.headers['content-type'] ?? 'image/png';
		});

		stream.on('data', (chunk) => {
			size += chunk.length;

			if (size > LOGO_MAX_SIZE) {
				return stream.destroy(new Error('logo size limit exited'));
			}

			logo.push(chunk);
		});
	});
};

const truncateString = (str, length) => {
	if (str && str.length > length) {
		return str.substr(0, length - 3) + '...';
	}

	return str;
};

const processDescription = (description) => {
	let charsPerLine = 65;
	let lineOffset = 205;
	let lineHeight = 36;

	let lines = wordwrap.hard(charsPerLine)(description).split('\n');

	if (lines.length > 2) {
		lines = lines.slice(0, 2);
		let lastLine = lines.pop();

		if (lastLine.length > charsPerLine) {
			lastLine = lastLine.substr(0, charsPerLine - 3);
		}

		lines.push(lastLine + '...');
	}

	lines = lines.map((text, idx) => {
		return { text, offset: lineOffset + lineHeight * idx };
	});

	return lines;
};

const processChart = (records, max, offsetX = 88, offsetY = 418) => {
	let barHeight = 40;
	let barPadding = 10;

	return records.map((record, idx) => {
		let h = max === 0 ? 0 : Math.floor((record.total / max) * barHeight);
		let x = offsetX + barPadding * idx;
		let y = offsetY + barHeight - h;

		return { h, x, y };
	});
};

const prepareMetadata = async (pkg) => {
	let cacheKey = `algolia::${pkg}`;

	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	let meta = await npmIndex.getObject(pkg, [ 'name', 'description', 'version', 'owner' ]);

	meta.owner.logo = await fetchLogo(meta.owner.avatar).catch(() => {});
	meta.description = processDescription(meta.description);

	cache.set(cacheKey, meta);

	return meta;
};

const prepareStats = async (name) => {
	let stats = await fetchStats(name);

	let formatNum = num => num.toLocaleString().replaceAll(',', ' ');
	let max = 0;

	let records = Object.values(stats.dates).map((stats) => {
		max = Math.max(max, stats.total);
		return { total: stats.total };
	});

	return {
		requests: {
			total: stats.total,
			totalFormatted: formatNum(stats.total),
			chart: processChart(records, max),
		},
		bandwidth: {
			total: stats.total,
			totalFormatted: formatNum(stats.total),
			chart: processChart(records, max, 580),
		},
	};
};

const composeTemplate = async (name, scope = null) => {
	let pkg = scope ? scope + '/' + name : name;
	let [ metadata, stats ] = await Promise.all([ prepareMetadata(pkg), prepareStats(pkg) ]);

	return {
		name: truncateString(name, 20),
		scope: truncateString(scope, 26),
		description: metadata.description,
		version: metadata.version,
		author: metadata.owner.name,
		logo: metadata.owner.logo,
		stats,
	};
};

const render = async (svg) => {
	return sharp(Buffer.from(svg))
		.png()
		.toBuffer();
};

module.exports = async (ctx) => {
	try {
		let data = await composeTemplate(ctx.params.name, ctx.params.scope);
		let svg = await ctx.render('og-pkg-template.svg', data);

		ctx.type = 'image/png';
		ctx.maxAge = 24 * 60 * 60;
		ctx.body = await render(svg);
	} catch (error) {
		if (error?.statusCode === 404) {
			return; // 404 response
		}

		throw error;
	}
};
