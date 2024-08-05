const { fontsProcessor, truncateString } = require('../utils');

const {
	getBaseInfo,
	getRangeString,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_GAP_NARROW,
	FIELD_PADDING,
} = require('./utils');

module.exports = async (ctx, data) => {
	return ctx.render('open-graph/gp-http.svg', prepareData(data));
};

function prepareData (data) {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result?.timings?.total) && obj.result?.statusCode);
	let { location, locationWidth, probes, target } = getBaseInfo(data);

	let method = data.measurementOptions?.request?.method ?? 'HEAD';
	let path = data.measurementOptions?.request?.path ?? '';
	let query = data.measurementOptions?.request?.query ?? '';
	let completePathString = '/' + path.replace(/^\//, '') + (query && '?' + query.replace(/^\?/, ''));
	path = truncateString(completePathString, 'Lexend SemiBold', 30, 800).text;

	let pathWidth = fontsProcessor.computeWidth(path, 'Lexend SemiBold', 30, -0.6);
	let methodWidth = fontsProcessor.computeWidth(method, 'Lexend SemiBold', 34, -0.6);

	if (viableData.length === 0) {
		return {
			location,
			target,
			probes,
			locationWidth,
			pathWidth,
			method,
			methodWidth,
			failure: true,
			path,
		};
	}

	let timeRange = `${getRangeString(viableData.map(obj => obj.result.timings?.total))} ms`;
	let statusCodes = getStatusCodes(data.results); // includes errors
	let usedStatusCodes = statusCodes.slice(0, 3);

	let remainingCodes = null;

	if (statusCodes.length > usedStatusCodes.length) {
		remainingCodes = { count: statusCodes.length - usedStatusCodes.length, offset: 0 };
	}

	usedStatusCodes.forEach((code, index) => {
		let width = fontsProcessor.computeWidth(`${code.code} `, 'Lexend SemiBold', 32, -0.6)
			+ fontsProcessor.computeWidth(`(${code.count})`, 'Lexend Regular', 30, -0.6);
		let offset;

		if (index === 0) {
			offset = START_X_POS;
		} else {
			offset = usedStatusCodes[index - 1].offset + usedStatusCodes[index - 1].width + FIELD_PADDING + 10;
		}

		code.offset = offset;
		code.width = width;

		if (index === 2 && remainingCodes) {
			remainingCodes.offset = offset + width + 42;
		}
	});

	let timeOffset;
	let codesHeaderWidth = fontsProcessor.computeWidth('Response status codes:', 'Lexend Regular', 30, 0);

	if (remainingCodes) {
		let remainingWidth = fontsProcessor.computeWidth(`+${remainingCodes.count}`, 'Lexend Regular', 32, -0.6);
		timeOffset = Math.max(START_X_POS + codesHeaderWidth, remainingWidth + remainingCodes.offset) + FIELD_GAP_NARROW;
	} else {
		timeOffset = Math.max(START_X_POS + codesHeaderWidth, usedStatusCodes.at(-1).offset + usedStatusCodes.at(-1).width + FIELD_PADDING) + FIELD_GAP_NARROW;
	}

	let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);
	let timeHeaderWidth = fontsProcessor.computeWidth('Total time:', 'Lexend Regular', 30, 0);
	let fieldWidth = Math.max(timeWidth + FIELD_PADDING, timeHeaderWidth);

	if (timeOffset + fieldWidth + FIELD_GAP_NARROW < X_POS_THRESHOLD) {
		timeOffset += FIELD_GAP_NARROW;
	}

	return {
		method,
		methodWidth,
		statusCodes: usedStatusCodes,
		timeRange,
		target,
		location,
		timeWidth,
		probes,
		locationWidth,
		timeOffset,
		path,
		pathWidth,
		remainingCodes,
	};
}

function getStatusCodes (array) {
	let filtered = array.filter(val => typeof val.result?.statusCode === 'number');

	let err = array.length - filtered.length;
	let statusCountMap = _.countBy(filtered, 'result.statusCode');

	if (err) {
		statusCountMap.Error = err;
	}

	let sortedCodes = _.sortBy(Object.keys(statusCountMap), code => statusCountMap[code]).reverse();
	sortedCodes = sortedCodes.map(code => ({ code, count: statusCountMap[code] }));

	return sortedCodes;
}
