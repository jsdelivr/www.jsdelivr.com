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
		let svg = await ctx.render('og-image-ping.svg', data);

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

const formatNumber = (number) => {
	if (number > 0 && number < 1) {
		return '1';
	}

	return number.toFixed(0);
};

const makeRangeString = (low, high) => {
	return low === high ? low : low + ' - ' + high;
};

// Based on https://en.wikipedia.org/wiki/Interquartile_range#Outliers:~:text=be%20indicated%20here.-,Outliers,-%5Bedit%5D
const removeOutliers = (array) => {
	let len = array.length;

	if (len < 10) {
		return array;
	}

	{
		let q1 = array[Math.floor(len * 0.25)];
		let q3 = array[Math.floor(len * 0.75)];
		let iqr = q3 - q1;

		let upperBound = q3 + 1.5 * iqr;
		let lowerBound = q1 - 1.5 * iqr;

		return array.filter(val => (val >= lowerBound) && (val <= upperBound));
	}
};

const getNumberRange = (array) => {
	let filtered = removeOutliers(array.filter(val => typeof val === 'number'));
	return makeRangeString(formatNumber(Math.min(...filtered)), formatNumber(Math.max(...filtered)));
};

const getLocationString = (locations) => {
	let locationStr = locations.map((location) => {
		return Object.values(location).join('+');
	}).join(', ');

	return truncateString(locationStr, 'Lexend SemiBold', 32, 550).text;
};

const generatePingOG = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.stats?.avg);

	let location = getLocationString(data.locations);
	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);
	let probes = data.results.length + ' probe' + ((data.results.length > 1) && 's');

	let svgData;

	if (viableData.length === 0) {
		svgData = {
			location,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			probes,
			locationWidth,
			failure: true,
		};
	} else {
		let latRange = getNumberRange(viableData.map(obj => obj.result.stats?.avg)) + ' ms';
		let lossRange = getNumberRange(viableData.map(obj => obj.result.stats?.loss)) + ' %';

		let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
		let packetLossWidth = fontsProcessor.computeWidth(lossRange, 'Lexend SemiBold', 32, -0.6);

		let lossOffset = Math.max(latencyWidth + 146, 347);

		svgData = {
			latRange,
			lossRange,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			location,
			latencyWidth,
			packetLossWidth,
			probes,
			locationWidth,
			lossOffset,
		};
	}

	return ctx.render('globalping-og/og-image-ping.svg', svgData);
};

const generateMtrOG = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.hops?.at(-1).stats?.avg);

	let location = getLocationString(data.locations);
	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);
	let probes = data.results.length + ' probe' + ((data.results.length > 1) && 's');

	let svgData;

	if (viableData.length === 0) {
		svgData = {
			location,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			probes,
			locationWidth,
			failure: true,
		};
	} else {
		let latRange = getNumberRange(viableData.map(obj => obj.result.hops?.at(-1).stats?.avg)) + ' ms';
		let lossRange = getNumberRange(viableData.map(obj => obj.result.hops?.at(-1).stats?.loss)) + ' %';
		let hopRange = getNumberRange(viableData.map(obj => obj.result.hops?.length));

		let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
		let packetLossWidth = fontsProcessor.computeWidth(lossRange, 'Lexend SemiBold', 32, -0.6);
		let hopRangeWidth = fontsProcessor.computeWidth(hopRange, 'Lexend SemiBold', 32, -0.6);

		let lossOffset = Math.max(latencyWidth + 146, 347);
		let hopOffset = Math.max(lossOffset + packetLossWidth + 60, lossOffset + 220);

		svgData = {
			latRange,
			lossRange,
			hopRange,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			location,
			latencyWidth,
			packetLossWidth,
			probes,
			locationWidth,
			lossOffset,
			hopRangeWidth,
			hopOffset };
	}

	return ctx.render('globalping-og/og-image-mtr.svg', svgData);
};

const generateTracerouteOG = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.hops?.at(-1).timings.length);

	let location = getLocationString(data.locations);
	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);
	let probes = data.results.length + ' probe' + ((data.results.length > 1) && 's');

	let svgData;

	if (viableData.length === 0) {
		svgData = {
			location,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			probes,
			locationWidth,
			failure: true,
		};
	} else {
		let latRange = getNumberRange(viableData.map(obj => _.mean(obj.result.hops?.at(-1).timings.map(timing => timing.rtt)))) + ' ms';
		let hopRange = getNumberRange(viableData.map(obj => obj.result.hops?.length));

		let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
		let hopRangeWidth = fontsProcessor.computeWidth(hopRange, 'Lexend SemiBold', 32, -0.6);

		let hopOffset = Math.max(latencyWidth + 146, 347);

		svgData = {
			latRange,
			hopRange,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			location,
			latencyWidth,
			probes,
			locationWidth,
			hopRangeWidth,
			hopOffset };
	}

	return ctx.render('globalping-og/og-image-traceroute.svg', svgData);
};

function getStatusCodes (array) {
	let statusCountMap = {};
	let filtered = array.filter(val => typeof val.result?.statusCode === 'number');

	let err = array.length - filtered.length;

	filtered.forEach((item) => {
		let code = item.result.statusCode?.toString();

		if (code in statusCountMap) {
			statusCountMap[code]++;
		} else {
			statusCountMap[code] = 1;
		}
	});

	let statusCountArray = Object.entries(statusCountMap);

	if (err) {
		statusCountArray.push([ 'Error', err ]);
	}

	statusCountArray.sort((a, b) => b[1] - a[1]);

	return statusCountArray;
}

const generateHttpOG = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result?.timings?.total && obj.result?.statusCode);

	let location = getLocationString(data.locations);
	let method = data.measurementOptions?.request?.method ?? 'HEAD';
	let probes = data.results.length + ' probe' + ((data.results.length > 1) && 's');

	let path = data.measurementOptions?.request?.path ?? '';
	let query = data.measurementOptions?.request?.query ?? '';
	let completePathString = '/' + path.replace(/^\//, '') + (query && '?' + query.replace(/^\?/, ''));
	let finalPath = truncateString(completePathString, 'Lexend SemiBold', 30, 800).text;

	let pathWidth = fontsProcessor.computeWidth(finalPath, 'Lexend SemiBold', 30, -0.6);
	let methodWidth = fontsProcessor.computeWidth(method, 'Lexend SemiBold', 34, -0.6);
	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);

	let svgData;

	if (viableData.length === 0) {
		svgData = {
			location,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			probes,
			locationWidth,
			pathWidth,
			method,
			methodWidth,
			failure: true,
			path: finalPath,
		};
	} else {
		let timeRange = getNumberRange(viableData.map(obj => obj.result.timings?.total)) + ' ms';
		let statusCodes = getStatusCodes(viableData);
		let usedStatusCodes = statusCodes.slice(0, 3);

		let remaining = null;
		let timeOffset = 0;

		if (statusCodes.length > usedStatusCodes.length) {
			remaining = { count: statusCodes.length - usedStatusCodes.length, offset: 0 };
		}

		usedStatusCodes.forEach((code, index) => {
			let width = fontsProcessor.computeWidth(`${code[0]} `, 'Lexend SemiBold', 32, -0.6) + fontsProcessor.computeWidth(`(${code[1]})`, 'Lexend Regular', 30, -0.6);
			let offset;

			if (index === 0) {
				offset = 88.5;
			} else {
				offset = usedStatusCodes[index - 1][2] + usedStatusCodes[index - 1][3] + 42;
			}

			code.push(offset);
			code.push(width);

			if (index === 2) {
				remaining.offset = offset + width + 42;
			}
		});

		if (remaining) {
			timeOffset = remaining.offset + fontsProcessor.computeWidth(`+${remaining.count}`, 'Lexend Regular', 32, -0.6) + 32;
		} else {
			timeOffset = usedStatusCodes.at(-1)[2] + usedStatusCodes.at(-1)[3] + 32;
		}

		let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);

		timeOffset = Math.max(timeOffset, 470);

		svgData = {
			method,
			methodWidth,
			statusCodes: usedStatusCodes,
			timeRange,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			location,
			timeWidth,
			statusCodesWidth: 500,
			probes,
			locationWidth,
			timeOffset,
			path: finalPath,
			pathWidth,
			remaining,
		};
	}

	return ctx.render('globalping-og/og-image-http.svg', svgData);
};

const generateTraceDnsOG = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops.length);

	console.log('\n\na\n\n');

	let location = getLocationString(data.locations);
	let probes = data.results.length + ' probe' + ((data.results.length > 1) && 's');

	console.log('\n\nb\n\n');

	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);

	let svgData;

	if (viableData.length === 0) {
		svgData = {
			location,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			probes,
			locationWidth,
			failure: true,
		};
	} else {
		console.log('\n\nc\n\n');
		let timeRange = getNumberRange(viableData.map(obj => obj.result.hops.at(-1).timings.total)) + ' ms';
		let answersRange = getNumberRange(viableData.map(obj => obj.result.hops.at(-1).answers.length));
		console.log('\n\nd\n\n');

		let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);
		let answersWidth = fontsProcessor.computeWidth(answersRange, 'Lexend SemiBold', 32, -0.6);

		let answersOffset = Math.max(timeWidth + 146, 347);

		svgData = {
			timeRange,
			answersRange,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			location,
			probes,
			timeWidth,
			locationWidth,
			answersWidth,
			answersOffset,
		};
	}

	return ctx.render('globalping-og/og-image-dns.svg', svgData);
};


const generateDnsOG = async (ctx, data) => {
	if (data.measurementOptions?.trace) {
		return generateTraceDnsOG(ctx, data);
	}

	let viableData = data.results.filter(obj => obj.result?.timings?.total && obj.result?.statusCode);

	let location = getLocationString(data.locations);
	let probes = data.results.length + ' probe' + ((data.results.length > 1) && 's');

	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);

	let svgData;

	if (viableData.length === 0) {
		svgData = {
			location,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			probes,
			locationWidth,
			pathWidth,
			method,
			methodWidth,
			failure: true,
			path: finalPath,
		};
	} else {
		let timeRange = getNumberRange(viableData.map(obj => obj.result.timings?.total)) + ' ms';
		let statusCodes = getStatusCodes(viableData);
		let usedStatusCodes = statusCodes.slice(0, 3);

		let remaining = null;
		let timeOffset = 0;

		if (statusCodes.length > usedStatusCodes.length) {
			remaining = { count: statusCodes.length - usedStatusCodes.length, offset: 0 };
		}

		usedStatusCodes.forEach((code, index) => {
			let width = fontsProcessor.computeWidth(`${code[0]} `, 'Lexend SemiBold', 32, -0.6) + fontsProcessor.computeWidth(`(${code[1]})`, 'Lexend Regular', 30, -0.6);
			let offset;

			if (index === 0) {
				offset = 88.5;
			} else {
				offset = usedStatusCodes[index - 1][2] + usedStatusCodes[index - 1][3] + 42;
			}

			code.push(offset);
			code.push(width);

			if (index === 2) {
				remaining.offset = offset + width + 42;
			}
		});

		if (remaining) {
			timeOffset = remaining.offset + fontsProcessor.computeWidth(`+${remaining.count}`, 'Lexend Regular', 32, -0.6) + 32;
		} else {
			timeOffset = usedStatusCodes.at(-1)[2] + usedStatusCodes.at(-1)[3] + 32;
		}

		let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);

		timeOffset = Math.max(timeOffset, 470);

		svgData = {
			method,
			methodWidth,
			statusCodes: usedStatusCodes,
			timeRange,
			target: truncateString(data.target, 'Lexend SemiBold', 72, 750).text,
			location,
			timeWidth,
			statusCodesWidth: 500,
			probes,
			locationWidth,
			timeOffset,
			path: finalPath,
			pathWidth,
			remaining,
		};
	}

	return ctx.render('globalping-og/og-image-http.svg', svgData);
};

module.exports.globalping = async (ctx) => {
	try {
		let data = await fetchGlobalpingStats(ctx.params.id.split(',')[0].split('.')[0]);

		if (!data || data.status !== 'finished') {
			// TODO return generic og image
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
				svg = await ctx.render('globalping-og/og-image-ping.svg', data);
			}
		}

		ctx.body = await render(svg);
		ctx.type = 'image/png';
		ctx.maxAge = 24 * 60 * 60; // 1 minute unless mes.status === finished
	} catch (error) {
		console.log(error);

		if (error?.statusCode === 404 || error?.status === 404) { // the algolia lib uses .status
			return; // 404 response
		}

		throw error;
	}
};
