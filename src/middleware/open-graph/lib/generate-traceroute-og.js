const { getNumberRange, getBaseInfo, fontsProcessor, START_X, FIELD_GAP_WIDE, FIELD_PADDING } = require('./helpers');

module.exports = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops?.at(-1).timings.length);

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
		let latRange = getNumberRange(viableData.map(obj => _.mean(obj.result.hops?.at(-1).timings.map(timing => timing.rtt)))) + ' ms';
		let hopRange = getNumberRange(viableData.map(obj => obj.result.hops?.length));

		let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
		let latencyHeaderWidth = fontsProcessor.computeWidth('Avg latency:', 'Lexend Regular', 30, 0);
		let hopRangeWidth = fontsProcessor.computeWidth(hopRange, 'Lexend SemiBold', 32, -0.6);

		let hopOffset = START_X + FIELD_GAP_WIDE + Math.max(latencyWidth + FIELD_PADDING, latencyHeaderWidth);

		svgData = {
			latRange,
			hopRange,
			target,
			location,
			latencyWidth,
			probes,
			locationWidth,
			hopRangeWidth,
			hopOffset };
	}

	return ctx.render('globalping-og/og-image-traceroute.svg', svgData);
};
