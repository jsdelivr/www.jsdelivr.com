const { fontsProcessor } = require('../utils');
const { getRangeString } = require('../../utils/globalping');

const {
	getBaseInfo,
	START_X_POS,
	FIELD_GAP_WIDE,
	FIELD_PADDING,
} = require('./utils');

module.exports = async (ctx, data) => {
	return ctx.render('open-graph/gp-ping.svg', prepareData(data));
};

function prepareData (data) {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result.stats?.avg));
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

	let latRange = `${getRangeString(viableData.map(obj => obj.result.stats?.avg))} ms`;
	let lossRange = `${getRangeString(viableData.map(obj => obj.result.stats?.loss))} %`;

	let latencyWidth = fontsProcessor.computeWidth(latRange, 'Lexend SemiBold', 32, -0.6);
	let latencyHeaderWidth = fontsProcessor.computeWidth('Avg latency:', 'Lexend Regular', 30, 0);
	let packetLossWidth = fontsProcessor.computeWidth(lossRange, 'Lexend SemiBold', 32, -0.6);

	let fieldWidth = Math.max(latencyWidth + FIELD_PADDING, latencyHeaderWidth);
	let lossOffset = START_X_POS + FIELD_GAP_WIDE + fieldWidth;

	return {
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
