// mac only. see: https://github.com/lovell/sharp/issues/2399#issuecomment-714381300
// process.env.PANGOCAIRO_BACKEND = 'fontconfig';
process.env.FONTCONFIG_PATH = 'fonts';

const path = require('path');
const bytes = require('bytes');
const sharp = require('sharp');
const LRU = require('lru-cache');
const entities = require('entities');
const FontsProcessor = require('./fonts');
const algoliaNode = require('../../lib/algolia-node');
const got = require('../../lib/got');
const { readFileSync } = require('fs');

const generatePingOG = require('./lib/generate-ping-og');
const generateMtrOG = require('./lib/generate-mtr-og');
const generateTracerouteOG = require('./lib/generate-traceroute-og');
const generateHttpOG = require('./lib/generate-http-og');
const generateDnsOG = require('./lib/generate-dns-og');

const globalpingOG = readFileSync(path.resolve(__dirname, '../../assets/img/og-globalping.png'));

const API_HOST = 'https://data.jsdelivr.com';
const GLOBALPING_API_HOST = 'https://api.globalping.io';
const LOGO_MAX_SIZE = 2 * 2 ** 20; // 2MiB

const cache = new LRU({ max: 1000, maxAge: 24 * 60 * 60 * 1000 });

const fontsProcessor = new FontsProcessor();
fontsProcessor.addFontSync('Lexend Regular', path.resolve(__dirname, '../../../fonts/Lexend-Regular.ttf'));
fontsProcessor.addFontSync('Lexend SemiBold', path.resolve(__dirname, '../../../fonts/Lexend-SemiBold.ttf'));

const fetchStats = async (name, type = 'npm', period = 'month') => {
	let [{ hits: requests, bandwidth }] = await Promise.all([
		got.get(`${API_HOST}/v1/stats/packages/${type}/${name}`, { searchParams: { period } }).json().catch(() => {}),
	]);

	return { requests, bandwidth };
};

const fetchGlobalpingStats = async (id) => {
	return got.get(`${GLOBALPING_API_HOST}/v1/measurements/${id}`).json().catch(() => {
	});
};

const fetchLogo = async (url) => {
	return new Promise((resolve, reject) => {
		let stream = got.stream.get(url);

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

/**
 *
 * @param {string} input
 * @returns {string}
 */
const cleanString = (input) => {
	return entities.decodeHTML(input).replace(/\p{Cc}/gu, '');
};

/**
 * @param {string} input
 * @param {string} fontFamily
 * @param {number} fontSize
 * @param {number} maxWidth
 * @param {number} letterSpacing
 * @return {{width: number, text: string}}
 */
const truncateString = (input, fontFamily, fontSize, maxWidth, letterSpacing = 0) => {
	let width = str => fontsProcessor.computeWidth(str, fontFamily, fontSize, letterSpacing);
	let truncate = (str) => {
		let strWidth = width(str);
		let dotsWidth = width('...');

		if (strWidth <= maxWidth) {
			return { text: str, width: strWidth };
		}

		while (strWidth > maxWidth - dotsWidth) {
			str = str.substr(0, str.length - 1);
			strWidth = width(str);
		}

		return { text: str + '...', width: strWidth + dotsWidth };
	};

	return truncate(cleanString(input));
};

const processDescription = (description) => {
	let maxLineWidth = 760;
	let lineOffset = 263;
	let lineHeight = 48;
	let fontSize = 30;
	let letterSpacing = -0.6;

	let lines = fontsProcessor.wrap(cleanString(description), 'Lexend Regular', fontSize, maxLineWidth, letterSpacing);

	if (lines.length > 2) {
		lines = lines.slice(0, 2);
		let lastLine = lines.pop();
		let lastLineWidth = () => fontsProcessor.computeWidth(lastLine, 'Lexend Regular', fontSize, letterSpacing);
		let dotsWidth = fontsProcessor.computeWidth('...', 'Lexend Regular', fontSize, letterSpacing);

		while (lastLineWidth() + dotsWidth >= maxLineWidth) {
			lastLine = lastLine.substr(0, lastLine.length - 1);
		}

		lines.push(lastLine + '...');
	}

	lines = lines.map((text, idx) => {
		return { text, offset: lineOffset + lineHeight * idx };
	});

	return lines;
};

const processChart = (records, max, offsetX = 88, offsetY = 386) => {
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

	let meta = await algoliaNode.getObjectWithCache(pkg);

	meta.owner.logo = await fetchLogo(meta.owner.avatar).catch(() => {});
	meta.description = processDescription(meta.description || '');

	cache.set(cacheKey, meta);

	return meta;
};

const prepareStats = async (name) => {
	let cacheKey = `stats::${name}`;

	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	let { requests, bandwidth } = await fetchStats(name);

	let formatRequests = num => num.toLocaleString().replace(/,/g, ' ');
	let formatBytes = num => bytes(num, { unitSeparator: ' ' });

	let processStats = (data, chartOffset, totalFormatter) => {
		let max = 0;

		let records = Object.values(data.dates).map((total) => {
			max = Math.max(max, total);
			return { total };
		});

		return {
			total: data.total,
			totalFormatted: totalFormatter(data.total),
			chart: processChart(records, max, chartOffset),
		};
	};

	let result = {
		requests: requests ? processStats(requests, 88, formatRequests) : undefined,
		bandwidth: bandwidth ? processStats(bandwidth, 550, formatBytes) : undefined,
	};

	cache.set(cacheKey, result);

	return result;
};

const composeTemplate = async (name, scope = null) => {
	let pkg = scope ? scope + '/' + name : name;
	let [ metadata, stats ] = await Promise.all([ prepareMetadata(pkg), prepareStats(pkg) ]);

	return {
		name: truncateString(name, 'Lexend SemiBold', scope ? 54 : 60, 760),
		scope: scope ? truncateString(scope, 'Lexend SemiBold', 38, 760) : null,
		description: metadata.description,
		author: truncateString(metadata.owner.name, 'Lexend SemiBold', 30, 340),
		version: truncateString(metadata.version, 'Lexend SemiBold', 30, 260),
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
		let svg = await ctx.render('og-image-template.svg.ractive', data);

		ctx.body = await render(svg);
		ctx.type = 'image/png';
		ctx.maxAge = 24 * 60 * 60;
	} catch (error) {
		if (error?.statusCode === 404 || error?.status === 404) { // the algolia lib uses .status
			return; // 404 response
		}

		throw error;
	}
};

module.exports.globalping = async (ctx) => {
	try {
		let data = await fetchGlobalpingStats(ctx.params.id.split(',')[0].split('.')[0]);

		if (!data || data.status !== 'finished') {
			ctx.body = globalpingOG;
			ctx.type = 'image/png';
			ctx.maxAge = 60;
			return;
		}

		let svg;

		switch (data.type) {
			case 'ping': {
				svg = await generatePingOG(ctx, data);
				break;
			}

			case 'mtr': {
				svg = await generateMtrOG(ctx, data);
				break;
			}

			case 'http': {
				svg = await generateHttpOG(ctx, data);
				break;
			}

			case 'traceroute': {
				svg = await generateTracerouteOG(ctx, data);
				break;
			}

			case 'dns': {
				svg = await generateDnsOG(ctx, data);
				break;
			}

			default: {
				ctx.body = globalpingOG;
				ctx.type = 'image/png';
				ctx.maxAge = 60;
				return;
			}
		}

		ctx.body = await render(svg);
		ctx.type = 'image/png';
		ctx.maxAge = 24 * 60 * 60;
	} catch (error) {
		console.log(error);

		if (error?.statusCode === 404 || error?.status === 404) { // the algolia lib uses .status
			return; // 404 response
		}

		throw error;
	}
};
