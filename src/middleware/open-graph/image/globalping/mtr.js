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
	return ctx.render('open-graph/gp-mtr.svg', prepareData(data));
};

function prepareData (data) {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result.hops?.at(-1).stats?.avg));
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

	let latRange = `${getRangeString(viableData.map(obj => obj.result.hops?.at(-1).stats?.avg))} ms`;
	let lossRange = `${getRangeString(viableData.map(obj => obj.result.hops?.at(-1).stats?.loss))} %`;
	let hopRange = getRangeString(viableData.map(obj => obj.result.hops?.length));

	let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
	let latencyHeaderWidth = fontsProcessor.computeWidth('Avg latency:', 'Lexend Regular', 30, 0);

	let packetLossWidth = fontsProcessor.computeWidth(lossRange, 'Lexend SemiBold', 32, -0.6);
	let packetLossHeaderWidth = fontsProcessor.computeWidth('Packet loss:', 'Lexend Regular', 30, 0);

	let hopRangeWidth = fontsProcessor.computeWidth(hopRange, 'Lexend SemiBold', 32, -0.6);
	let hopsHeaderWidth = fontsProcessor.computeWidth('Hops:', 'Lexend Regular', 30, 0);

	let lossOffset = START_X_POS + Math.max(latencyWidth + FIELD_PADDING, latencyHeaderWidth);
	let hopOffset = lossOffset + Math.max(packetLossWidth + FIELD_PADDING, packetLossHeaderWidth);
	let fieldWidth = Math.max(hopsHeaderWidth, hopRangeWidth + FIELD_PADDING);

	if (hopOffset + fieldWidth + 2 * FIELD_GAP_WIDE < X_POS_THRESHOLD) {
		lossOffset += FIELD_GAP_WIDE;
		hopOffset += 2 * FIELD_GAP_WIDE;
	} else {
		lossOffset += FIELD_GAP_NARROW;
		hopOffset += 2 * FIELD_GAP_NARROW;
	}

	return {
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
		hopOffset,
	};
}
