const { getNumberRange, fontsProcessor, START_X, FIELD_PADDING, FIELD_GAP_NARROW,
	getBaseInfo, truncateString, getStatusCodes, MAX_X,
} = require('./helpers');

module.exports = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result?.timings?.total && obj.result?.statusCode);

	let { location, locationWidth, probes, target } = getBaseInfo(data);

	let method = data.measurementOptions?.request?.method ?? 'HEAD';

	let path = data.measurementOptions?.request?.path ?? '';
	let query = data.measurementOptions?.request?.query ?? '';
	let completePathString = '/' + path.replace(/^\//, '') + (query && '?' + query.replace(/^\?/, ''));
	path = truncateString(completePathString, 'Lexend SemiBold', 30, 800).text;

	let pathWidth = fontsProcessor.computeWidth(path, 'Lexend SemiBold', 30, -0.6);
	let methodWidth = fontsProcessor.computeWidth(method, 'Lexend SemiBold', 34, -0.6);

	let svgData;

	if (viableData.length === 0) {
		svgData = {
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
	} else {
		let timeRange = getNumberRange(viableData.map(obj => obj.result.timings?.total)) + ' ms';
		let statusCodes = getStatusCodes(data.results); // should include errors
		let usedStatusCodes = statusCodes.slice(0, 3);

		let remaining = null;

		if (statusCodes.length > usedStatusCodes.length) {
			remaining = { count: statusCodes.length - usedStatusCodes.length, offset: 0 };
		}

		usedStatusCodes.forEach((code, index) => {
			let width = fontsProcessor.computeWidth(`${code.code} `, 'Lexend SemiBold', 32, -0.6) + fontsProcessor.computeWidth(`(${code.count})`, 'Lexend Regular', 30, -0.6);
			let offset;

			if (index === 0) {
				offset = START_X;
			} else {
				offset = usedStatusCodes[index - 1].offset + usedStatusCodes[index - 1].width + FIELD_PADDING + 10;
			}

			code.offset = offset;
			code.width = width;

			if (index === 2) {
				remaining.offset = offset + width + 42;
			}
		});

		let timeOffset;
		let codesHeaderWidth = fontsProcessor.computeWidth('Response status codes:', 'Lexend Regular', 30, 0);

		if (remaining) {
			let remainingWidth = fontsProcessor.computeWidth(`+${remaining.count}`, 'Lexend Regular', 32, -0.6);
			timeOffset = Math.max(START_X + codesHeaderWidth, remainingWidth + remaining.offset) + FIELD_GAP_NARROW;
		} else {
			timeOffset = Math.max(START_X + codesHeaderWidth, usedStatusCodes.at(-1).offset + usedStatusCodes.at(-1).width + FIELD_PADDING) + FIELD_GAP_NARROW;
		}

		let timeWidth = fontsProcessor.computeWidth(timeRange, 'Lexend SemiBold', 32, -0.6);
		let timeHeaderWidth = fontsProcessor.computeWidth('Total time:', 'Lexend Regular', 30, 0);

		if (timeOffset + Math.max(timeWidth + FIELD_PADDING, timeHeaderWidth) + FIELD_GAP_NARROW < MAX_X) {
			timeOffset += FIELD_GAP_NARROW;
		}

		svgData = {
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
			remaining,
		};
	}

	return ctx.render('globalping-og/og-image-http.svg', svgData);
};
