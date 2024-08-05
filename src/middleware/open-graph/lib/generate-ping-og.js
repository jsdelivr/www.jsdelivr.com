const { getNumberRange, getBaseInfo, fontsProcessor, START_X, FIELD_GAP_WIDE, FIELD_PADDING } = require('./helpers');

module.exports = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result.stats?.avg);

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
		let latRange = getNumberRange(viableData.map(obj => obj.result.stats?.avg)) + ' ms';
		let lossRange = getNumberRange(viableData.map(obj => obj.result.stats?.loss)) + ' %';

		let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
		let latencyHeaderWidth = fontsProcessor.computeWidth('Avg latency:', 'Lexend Regular', 30, 0);
		let packetLossWidth = fontsProcessor.computeWidth(lossRange, 'Lexend SemiBold', 32, -0.6);

		let lossOffset = START_X + FIELD_GAP_WIDE + Math.max(latencyWidth + FIELD_PADDING, latencyHeaderWidth);

		svgData = {
			latRange,
			lossRange,
			target,
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
