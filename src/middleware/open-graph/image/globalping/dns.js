const { fontsProcessor } = require('../utils');
const { getRangeString, getViableData } = require('../../utils/globalping');
const {
	getBaseInfo,
	getBaseComparisonInfo,
	getHeaderWidths,
	getTargetField,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_GAP_WIDE,
	FIELD_GAP_NARROW,
	FIELD_PADDING,
} = require('./utils');

function getFieldContents (data, isTrace = false) {
	let timeRange;
	let answersRange;

	if (isTrace) {
		timeRange = `${getRangeString(data.map(obj => obj.result.hops.at(-1).timings.total))} ms`;
		answersRange = getRangeString(data.map(obj => obj.result.hops.at(-1).answers.length));
	} else {
		timeRange = `${getRangeString(data.map(obj => obj.result.timings.total))} ms`;
		answersRange = getRangeString(data.map(obj => obj.result.answers.length));
	}

	return {
		timeRange,
		answersRange,
		timeWidth: fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6),
		answersWidth: fontsProcessor.computeWidth(answersRange, 'Lexend SemiBold', 32, -0.6),
	};
}

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

	let { timeRange, answersRange, timeWidth, answersWidth } = getFieldContents(viableData);
	let timeHeader = 'Time:';
	let [ timeHeaderWidth, answersHeaderWidth, errorsHeaderWidth ] = getHeaderWidths(timeHeader, 'Number of answers:', 'Errors:');

	let answersOffset = START_X_POS + FIELD_GAP_WIDE + Math.max(timeWidth + FIELD_PADDING, timeHeaderWidth);
	let errorOffset = answersOffset + Math.max(answersWidth + FIELD_PADDING, answersHeaderWidth);

	let errors = viableData.filter(obj => obj.result.statusCode !== 0);

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
		timeHeader,
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

	let { timeRange, answersRange, timeWidth, answersWidth } = getFieldContents(viableData, true);
	let timeHeader = 'Query time:';
	let [ timeHeaderWidth ] = getHeaderWidths(timeHeader);

	let answersOffset = START_X_POS + FIELD_GAP_WIDE + Math.max(timeWidth + FIELD_PADDING, timeHeaderWidth);

	return {
		timeHeader,
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

function prepareComparisonData (data) {
	let { probes, location, locationWidth } = getBaseComparisonInfo(data);
	let timeHeader = data[0].measurementOptions?.trace ? 'Query time' : 'Time';
	let [ maxTimeWidth, maxTargetWidth, maxAnswersWidth ] = getHeaderWidths(timeHeader, 'Target', 'Number of answers');

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

		let { timeRange, answersRange, timeWidth, answersWidth } = getFieldContents(viableData, meas.measurementOptions?.trace);
		maxTimeWidth = Math.max(maxTimeWidth, timeWidth);
		maxAnswersWidth = Math.max(maxAnswersWidth, answersWidth);

		return {
			target,
			timeRange,
			answersRange,
		};
	});

	let timeOffset = START_X_POS + maxTargetWidth + 1.5 * FIELD_GAP_WIDE;
	let answersOffset = timeOffset + maxTimeWidth + FIELD_GAP_WIDE;

	if (answersOffset + maxAnswersWidth > X_POS_THRESHOLD) {
		// equally reduce the size of gaps between fields (originally 2.5*FIELD_GAP_WIDE pixels) such that we do not overflow X_POS_THRESHOLD
		// if the gap becomes too narrow, allow the overflow and set the squeezeCoeff to 0.2 (should not happen)
		// results from: overflow = 2.5 * FIELD_GAP_WIDE - 2.5 * FIELD_GAP_WIDE * squeezeCoeff
		let squeezeCoeff = Math.max(1 - (answersOffset + maxAnswersWidth - X_POS_THRESHOLD) / (2.5 * FIELD_GAP_WIDE), 0.2);
		timeOffset = START_X_POS + maxTargetWidth + 1.5 * FIELD_GAP_WIDE * squeezeCoeff;
		answersOffset = timeOffset + maxTimeWidth + FIELD_GAP_WIDE * squeezeCoeff;
	}

	return {
		targets,
		location,
		probes,
		locationWidth,
		timeOffset,
		answersOffset,
		timeHeader,
	};
}

module.exports = async (ctx, data) => {
	if (data.length === 1) {
		return ctx.render('open-graph/gp-dns.svg', prepareData(data[0]));
	}

	return ctx.render('open-graph/gp-dns-comp.svg', prepareComparisonData(data));
};
