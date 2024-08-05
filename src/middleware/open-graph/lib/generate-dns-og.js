const { getNumberRange, getBaseInfo, fontsProcessor, START_X, FIELD_GAP_WIDE, FIELD_PADDING, FIELD_GAP_NARROW, MAX_X } = require('./helpers');

const generateTraceDnsOG = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops.length);

	let { location, locationWidth, probes, target } = getBaseInfo(data);

	let svgData;

	if (viableData.length === 0) {
		svgData = {
			location,
			target,
			probes,
			locationWidth,
			failure: true,
		};
	} else {
		let timeRange = getNumberRange(viableData.map(obj => obj.result.hops.at(-1).timings.total)) + ' ms';
		let answersRange = getNumberRange(viableData.map(obj => obj.result.hops.at(-1).answers.length));

		let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);
		let timeHeaderWidth = fontsProcessor.computeWidth('Time:', 'Lexend SemiBold', 30, 0);

		let answersWidth = fontsProcessor.computeWidth(answersRange, 'Lexend SemiBold', 32, -0.6);
		let answersOffset = START_X + FIELD_GAP_WIDE + Math.max(timeWidth + FIELD_PADDING, timeHeaderWidth);

		svgData = {
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

	return ctx.render('globalping-og/og-image-dns.svg', svgData);
};

module.exports = async (ctx, data) => {
	if (data.measurementOptions?.trace) {
		return generateTraceDnsOG(ctx, data);
	}

	let viableData = data.results.filter(obj => obj.result.status === 'finished');

	let { location, locationWidth, probes, target } = getBaseInfo(data);

	let svgData;

	if (viableData.length === 0) {
		svgData = {
			location,
			target,
			probes,
			locationWidth,
			failure: true,
		};
	} else {
		let timeRange = getNumberRange(viableData.map(obj => obj.result.timings.total)) + ' ms';
		let answersRange = getNumberRange(viableData.map(obj => obj.result.answers.length));

		let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);
		let timeHeaderWidth = fontsProcessor.computeWidth('Time:', 'Lexend SemiBold', 30, 0);

		let answersWidth = fontsProcessor.computeWidth(answersRange, 'Lexend SemiBold', 32, -0.6);
		let answersHeaderWidth = fontsProcessor.computeWidth('Number of answers:', 'Lexend Regular', 30, 0);

		let answersOffset = START_X + Math.max(timeWidth + FIELD_PADDING, timeHeaderWidth);
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
			let errorCodeMap = {};

			errors.forEach((item) => {
				let code = item.result.statusCodeName;

				if (code in errorCodeMap) {
					errorCodeMap[code]++;
				} else {
					errorCodeMap[code] = 1;
				}
			});

			mostCommonError = _.max(Object.keys(errorCodeMap), code => errorCodeMap[code]);
			mostCommonErrorCount = errorCodeMap[mostCommonError];
			mostCommonErrorWidth = fontsProcessor.computeWidth(mostCommonError + ' ', 'Lexend SemiBold', 32, -0.6) + (mostCommonErrorCount ? fontsProcessor.computeWidth(mostCommonErrorCount + '()', 'Lexend Regular', 30, -0.6) : 0);
			remainingErrors = Object.keys(errorCodeMap).length - 1;
			remainingErrorsWidth = remainingErrors ? Number(fontsProcessor.computeWidth('+' + remainingErrors, 'Lexend Regular', 32, -0.6)) : 0;
			remainingErrorsOffset = remainingErrors ? mostCommonErrorWidth + FIELD_PADDING + 10 : 0;
		}

		if (errors.length && errorOffset + Math.max(mostCommonErrorWidth + FIELD_PADDING + remainingErrorsOffset + remainingErrorsWidth, errorsHeaderWidth) + 2 * FIELD_GAP_WIDE > MAX_X) {
			answersOffset += FIELD_GAP_NARROW;
			errorOffset += 2 * FIELD_GAP_NARROW;
		} else {
			answersOffset += FIELD_GAP_WIDE;
			errorOffset += 2 * FIELD_GAP_WIDE;
		}

		remainingErrorsOffset += errorOffset;

		svgData = {
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

	return ctx.render('globalping-og/og-image-dns.svg', svgData);
};
