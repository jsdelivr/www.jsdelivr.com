const { getNumberRange, fontsProcessor, MAX_X, START_X, FIELD_PADDING, FIELD_GAP_NARROW, FIELD_GAP_WIDE,
	getBaseInfo,
} = require('./helpers');

module.exports = async (ctx, data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops?.at(-1).stats?.avg);

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
		let latRange = getNumberRange(viableData.map(obj => obj.result.hops?.at(-1).stats?.avg)) + ' ms';
		let lossRange = getNumberRange(viableData.map(obj => obj.result.hops?.at(-1).stats?.loss)) + ' %';
		let hopRange = getNumberRange(viableData.map(obj => obj.result.hops?.length));

		let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
		let latencyHeaderWidth = fontsProcessor.computeWidth('Avg latency:', 'Lexend Regular', 30, 0);

		let packetLossWidth = fontsProcessor.computeWidth(lossRange, 'Lexend SemiBold', 32, -0.6);
		let packetLossHeaderWidth = fontsProcessor.computeWidth('Packet loss:', 'Lexend Regular', 30, 0);

		let hopRangeWidth = fontsProcessor.computeWidth(hopRange, 'Lexend SemiBold', 32, -0.6);
		let hopsHeaderWidth = fontsProcessor.computeWidth('Hops:', 'Lexend Regular', 30, 0);

		let lossOffset = START_X + Math.max(latencyWidth + FIELD_PADDING, latencyHeaderWidth);
		let hopOffset = lossOffset + Math.max(packetLossWidth + FIELD_PADDING, packetLossHeaderWidth);

		if (hopOffset + Math.max(hopsHeaderWidth, hopRangeWidth + FIELD_PADDING) + 2 * FIELD_GAP_WIDE < MAX_X) {
			lossOffset += FIELD_GAP_WIDE;
			hopOffset += 2 * FIELD_GAP_WIDE;
		} else {
			lossOffset += FIELD_GAP_NARROW;
			hopOffset += 2 * FIELD_GAP_NARROW;
		}

		svgData = {
			latRange,
			lossRange,
			hopRange,
			target,
			location,
			latencyWidth,
			packetLossWidth,
			probes,
			locationWidth,
			lossOffset,
			hopRangeWidth,
			hopOffset };
	}

	return ctx.render('globalping-og/og-image-mtr.svg', svgData);
};
