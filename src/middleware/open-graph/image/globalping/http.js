const { getRangeString, getStatusCodes, getViableData } = require('../../utils/globalping');
const {
	getBaseInfo,
	getHeaderWidths,
	getBaseComparisonInfo,
	getTargetField,
	getFieldWidth,
	truncateField,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_GAP_NARROW,
	FIELD_PADDING,
	FIELD_GAP_WIDE,
	FIELD_TYPES,
} = require('./utils');

function getHttpInformation (data) {
	let method = data.measurementOptions?.request?.method ?? 'HEAD';

	let path = data.measurementOptions?.request?.path ?? '';
	let query = data.measurementOptions?.request?.query ?? '';
	let completePathString = '/' + path.replace(/^\//, '') + (query && '?' + query.replace(/^\?/, ''));
	path = truncateField(completePathString, 800, FIELD_TYPES.PATH);

	return {
		path,
		method,
		pathWidth: getFieldWidth(path, FIELD_TYPES.PATH),
		methodWidth: getFieldWidth(method, FIELD_TYPES.BIGGER),
	};
}

function getFieldContents (data) {
	let timeRange = `${getRangeString(data.map(obj => obj.result.timings?.total))} ms`;

	return {
		timeRange,
		timeWidth: getFieldWidth(timeRange),
	};
}

function prepareData (data) {
	let viableData = getViableData(data);
	let { location, locationWidth, probes, target } = getBaseInfo(data);
	let { path, pathWidth, method, methodWidth } = getHttpInformation(data);

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

	let { timeRange, timeWidth } = getFieldContents(viableData);
	let statusCodes = getStatusCodes(data.results); // includes errors
	let usedStatusCodes = statusCodes.slice(0, 3);

	let remainingCodes = null;

	if (statusCodes.length > usedStatusCodes.length) {
		remainingCodes = { count: statusCodes.length - usedStatusCodes.length, offset: 0 };
	}

	usedStatusCodes.forEach((code, index) => {
		let width = getFieldWidth(`${code.code} `) + getFieldWidth(`(${code.count})`, FIELD_TYPES.SMALLER);
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

	let [ timeHeaderWidth, codesHeaderWidth ] = getHeaderWidths('Total time:', 'Response status codes:');

	let timeOffset;

	if (remainingCodes) {
		let remainingWidth = getFieldWidth(`+${remainingCodes.count}`, FIELD_TYPES.REGULAR);
		timeOffset = Math.max(START_X_POS + codesHeaderWidth, remainingWidth + remainingCodes.offset) + FIELD_GAP_NARROW;
	} else {
		timeOffset = Math.max(START_X_POS + codesHeaderWidth, usedStatusCodes.at(-1).offset + usedStatusCodes.at(-1).width + FIELD_PADDING) + FIELD_GAP_NARROW;
	}

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

function prepareComparisonData (data) {
	let { probes, location, locationWidth } = getBaseComparisonInfo(data);
	let { path, method, pathWidth, methodWidth } = getHttpInformation(data[0]);
	let [ statusWidth, maxTargetWidth ] = getHeaderWidths('Top status code', 'Target');

	let targets = data.map((meas) => {
		let viableData = getViableData(meas);
		let { target, targetWidth } = getTargetField(meas);
		maxTargetWidth = Math.max(maxTargetWidth, targetWidth);

		if (viableData.length === 0) {
			return {
				target,
				failure: true,
			};
		}

		let topStatusCode = getStatusCodes(meas)[0];
		let { timeRange } = getFieldContents(viableData);

		return {
			target,
			topStatusCode,
			timeRange,
		};
	});

	let statusOffset = START_X_POS + maxTargetWidth + 1.5 * FIELD_GAP_WIDE;
	let timeOffset = statusOffset + statusWidth + FIELD_GAP_WIDE;

	return {
		targets,
		location,
		probes,
		path,
		method,
		pathWidth,
		methodWidth,
		locationWidth,
		statusOffset,
		timeOffset,
	};
}

module.exports = async (ctx, data) => {
	if (data.length === 1) {
		return ctx.render('open-graph/gp-http.svg', prepareData(data[0]));
	}

	return ctx.render('open-graph/gp-http-comp.svg', prepareComparisonData(data));
};
