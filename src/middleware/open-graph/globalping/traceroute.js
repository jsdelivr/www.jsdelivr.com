const { fontsProcessor } = require('../utils');

const {
	getBaseInfo,
	getRangeString,
	START_X_POS,
	FIELD_GAP_WIDE,
	FIELD_PADDING,
} = require('./utils');

module.exports = async (ctx, data) => {
	return ctx.render('open-graph/gp-traceroute.svg', prepareData(data));
};

function prepareData (data) {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops?.at(-1).timings.length);
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

	let latRange = getRangeString(viableData.map(obj => _.mean(obj.result.hops?.at(-1).timings.map(timing => timing.rtt)))) + ' ms';
	let hopRange = getRangeString(viableData.map(obj => obj.result.hops?.length));

	let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
	let latencyHeaderWidth = fontsProcessor.computeWidth('Avg latency:', 'Lexend Regular', 30, 0);
	let hopRangeWidth = fontsProcessor.computeWidth(hopRange, 'Lexend SemiBold', 32, -0.6);

	let fieldWidth = Math.max(latencyWidth + FIELD_PADDING, latencyHeaderWidth);
	let hopOffset = START_X_POS + FIELD_GAP_WIDE + fieldWidth;

	return {
		latRange,
		hopRange,
		target,
		location,
		latencyWidth,
		probes,
		locationWidth,
		hopRangeWidth,
		hopOffset,
	};
}
