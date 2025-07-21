const _ = require('lodash');
const { fontsProcessor } = require('../utils');
const { getRangeString } = require('../../utils/globalping');
const {
	getBaseInfo,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_GAP_WIDE,
	FIELD_GAP_NARROW,
	FIELD_PADDING,
} = require('./utils');

module.exports = async (ctx, data) => {
	return ctx.render('open-graph/gp-dns.svg', prepareData(data));
};

function prepareData (data) {
	if (data.measurementOptions?.trace) {
		return prepareTraceData(data);
	}

	let viableData = data.results.filter(obj => obj.result.status === 'finished');
	let { location, locationWidth, probes, target } = getBaseInfo(data);

	if (viableData.length === 0) {
		return {
			location,
			target,
			probes,
			locationWidth,
			failure: true,
		};
	}

	let timeRange = `${getRangeString(viableData.map(obj => obj.result.timings.total))} ms`;
	let answersRange = getRangeString(viableData.map(obj => obj.result.answers.length));

	let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);
	let timeHeaderWidth = fontsProcessor.computeWidth('Time:', 'Lexend SemiBold', 30, 0);

	let answersWidth = fontsProcessor.computeWidth(answersRange, 'Lexend SemiBold', 32, -0.6);
	let answersHeaderWidth = fontsProcessor.computeWidth('Number of answers:', 'Lexend Regular', 30, 0);

	let answersOffset = START_X_POS + Math.max(timeWidth + FIELD_PADDING, timeHeaderWidth);
	let errorOffset = answersOffset + Math.max(answersWidth + FIELD_PADDING, answersHeaderWidth);

	let errors = viableData.filter(obj => obj.result.statusCode !== 0);
	let errorsHeaderWidth = fontsProcessor.computeWidth('Errors:', 'Lexend Regular', 30, 0);

	let mostCommonError;
	let mostCommonErrorCount;
	let mostCommonErrorWidth;

	let remainingErrors;
	let remainingErrorsWidth;
	let remainingErrorsOffset;

	if (errors.length) {
		let errorCodeMap = _.countBy(errors, 'result.statusCodeName');
		mostCommonError = _.maxBy(Object.keys(errorCodeMap), code => errorCodeMap[code]);
		mostCommonErrorCount = errorCodeMap[mostCommonError];
		mostCommonErrorWidth = fontsProcessor.computeWidth(mostCommonError + ' ', 'Lexend SemiBold', 32, -0.6) + (mostCommonErrorCount ? fontsProcessor.computeWidth(mostCommonErrorCount + '()', 'Lexend Regular', 30, -0.6) : 0);
		remainingErrors = Object.keys(errorCodeMap).length - 1;
		remainingErrorsWidth = remainingErrors ? Number(fontsProcessor.computeWidth('+' + remainingErrors, 'Lexend Regular', 32, -0.6)) : 0;
		remainingErrorsOffset = remainingErrors ? mostCommonErrorWidth + FIELD_PADDING + 10 : 0;
	}

	let fieldWidth = Math.max(mostCommonErrorWidth + FIELD_PADDING + remainingErrorsOffset + remainingErrorsWidth, errorsHeaderWidth);

	if (errors.length && errorOffset + fieldWidth + 2 * FIELD_GAP_WIDE > X_POS_THRESHOLD) {
		answersOffset += FIELD_GAP_NARROW;
		errorOffset += 2 * FIELD_GAP_NARROW;
	} else {
		answersOffset += FIELD_GAP_WIDE;
		errorOffset += 2 * FIELD_GAP_WIDE;
	}

	remainingErrorsOffset += errorOffset;

	return {
		timeRange,
		answersRange,
		target,
		location,
		probes,
		timeWidth,
		locationWidth,
		answersWidth,
		answersOffset,
		mostCommonError,
		mostCommonErrorCount,
		mostCommonErrorWidth,
		remainingErrors,
		errorOffset,
		remainingErrorsOffset,
	};
}

function prepareTraceData (data) {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops.length);
	let { location, locationWidth, probes, target } = getBaseInfo(data);

	if (viableData.length === 0) {
		return {
			location,
			target,
			probes,
			locationWidth,
			failure: true,
		};
	}

	let timeRange = `${getRangeString(viableData.map(obj => obj.result.hops.at(-1).timings.total))} ms`;
	let answersRange = getRangeString(viableData.map(obj => obj.result.hops.at(-1).answers.length));

	let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);
	let timeHeaderWidth = fontsProcessor.computeWidth('Query time:', 'Lexend SemiBold', 30, 0);

	let answersWidth = fontsProcessor.computeWidth(answersRange, 'Lexend SemiBold', 32, -0.6);
	let answersOffset = START_X_POS + FIELD_GAP_WIDE + Math.max(timeWidth + FIELD_PADDING, timeHeaderWidth);

	return {
		timeRange,
		answersRange,
		target,
		location,
		probes,
		timeWidth,
		locationWidth,
		answersWidth,
		answersOffset,
	};
}
