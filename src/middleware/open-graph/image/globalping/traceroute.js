const { fontsProcessor } = require('../utils');
const { getRangeString, getViableData } = require('../../utils/globalping');

const {
	getBaseInfo,
	getBaseComparisonInfo,
	getTargetField,
	getHeaderWidths,
	START_X_POS,
	FIELD_GAP_WIDE,
	FIELD_PADDING,
} = require('./utils');

function getFieldContents (data) {
	let latencyRange = getRangeString(data.map(obj => _.mean(obj.result.hops?.at(-1).timings.map(timing => timing.rtt)))) + ' ms';
	let hopRange = getRangeString(data.map(obj => obj.result.hops?.length));

	return {
		latencyRange,
		hopRange,
		latencyWidth: fontsProcessor.computeWidth(latencyRange, 'Lexend SemiBold', 32, -0.6),
		hopWidth: fontsProcessor.computeWidth(hopRange, 'Lexend SemiBold', 32, -0.6),
	};
}

function prepareData (data) {
	let viableData = getViableData(data);
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

	let { latencyRange, hopRange, latencyWidth, hopWidth } = getFieldContents(viableData);

	let fieldWidth = Math.max(latencyWidth + FIELD_PADDING, ...getHeaderWidths('Avg latency:'));
	let hopOffset = START_X_POS + FIELD_GAP_WIDE + fieldWidth;

	return {
		latencyRange,
		hopRange,
		target,
		location,
		latencyWidth,
		probes,
		locationWidth,
		hopWidth,
		hopOffset,
	};
}

function prepareComparisonData (data) {
	let { probes, location, locationWidth } = getBaseComparisonInfo(data);
	let [ maxLatencyWidth, maxTargetWidth ] = getHeaderWidths('Avg latency', 'Target');

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

		let { latencyRange, hopRange, latencyWidth } = getFieldContents(viableData);
		maxLatencyWidth = Math.max(maxLatencyWidth, latencyWidth);

		return {
			target,
			latencyRange,
			hopRange,
		};
	});

	let latencyOffset = START_X_POS + maxTargetWidth + 1.5 * FIELD_GAP_WIDE;
	let hopOffset = latencyOffset + maxLatencyWidth + FIELD_GAP_WIDE;

	return {
		targets,
		location,
		probes,
		latencyOffset,
		hopOffset,
		locationWidth,
	};
}

module.exports = async (ctx, data) => {
	if (data.length === 1) {
		return ctx.render('open-graph/gp-traceroute.svg', prepareData(data[0]));
	}

	return ctx.render('open-graph/gp-traceroute-comp.svg', prepareComparisonData(data));
};
