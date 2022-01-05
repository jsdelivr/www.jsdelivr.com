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

const processDescription = (description) => {
	let charsPerLine = 65;
	let lineOffset = 205;
	let lineHeight = 36;

	let lines = wordwrap(charsPerLine)(description.substring(0, charsPerLine * 2)).split('\n');

	if (lines.length > 2) {
		lines = lines.slice(0, 2);
		let lastLine = lines.pop();

		if (lastLine.length > charsPerLine - 3) {
			lastLine = lastLine.split(' ').slice(0, -1).join(' ');
		}

		lines.push(lastLine + '...');
	}

	lines = lines.map((text, idx) => {
		return { text, offset: lineOffset + lineHeight * idx };
	});

	return lines;
};

const processRequestsChart = (records, max) => {
	let barHeight = 40;
	let barPadding = 10;
	let offsetX = 88;
	let offsetY = 418;

	return records.map((record, idx) => {
		let h = Math.floor((record.total / max) * barHeight);
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

	let requestsChart = processRequestsChart(records, max);

	return {
		total: stats.total,
		totalFormatted: formatNum(stats.total),
		requestsChart,
	};
};

const composeTemplate = async (name) => {
	let [ metadata, stats ] = await Promise.all([ prepareMetadata(name), prepareStats(name) ]);

	return {
		name: metadata.name,
		description: metadata.description,
		version: metadata.version,
		author: metadata.owner.name,
		logo: metadata.owner.logo,
		requests_total: stats.totalFormatted,
		requests_chart: stats.requestsChart,
	};
};

const render = async (svg) => {
	return sharp(Buffer.from(svg))
		.png()
		.toBuffer();
};

module.exports = async (ctx) => {
	let data = await composeTemplate(ctx.params.name);
	let svg = await ctx.render('og-pkg-template.svg', data);

	ctx.set('Content-Type', 'image/png');
	ctx.maxAge = 24 * 60 * 60;
	ctx.body = await render(svg).catch(err => console.log(err));
};
