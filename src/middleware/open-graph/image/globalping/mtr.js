const { fontsProcessor } = require('../utils');
const { getRangeString, getViableData } = require('../../utils/globalping');

const {
	getBaseInfo,
	getBaseComparisonInfo,
	getTargetField,
	getHeaderWidths,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_GAP_WIDE,
	FIELD_GAP_NARROW,
	FIELD_PADDING,
} = require('./utils');

function getFieldContents (data) {
	let latencyRange = `${getRangeString(data.map(obj => obj.result.hops?.at(-1).stats?.avg))} ms`;
	let lossRange = `${getRangeString(data.map(obj => obj.result.hops?.at(-1).stats?.loss))} %`;
	let hopRange = getRangeString(data.map(obj => obj.result.hops?.length));

	return {
		latencyRange,
		lossRange,
		hopRange,
		latencyWidth: fontsProcessor.computeWidth(latencyRange, 'Lexend SemiBold', 32, -0.6),
		lossWidth: fontsProcessor.computeWidth(lossRange, 'Lexend SemiBold', 32, -0.6),
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

	let { latencyRange, lossRange, hopRange, latencyWidth, lossWidth, hopWidth } = getFieldContents(viableData);
	let [ latencyHeaderWidth, lossHeaderWidth, hopsHeaderWidth ] = getHeaderWidths('Avg latency:', 'Packet loss:', 'Hops:');

	let lossOffset = START_X_POS + Math.max(latencyWidth + FIELD_PADDING, latencyHeaderWidth);
	let hopOffset = lossOffset + Math.max(lossWidth + FIELD_PADDING, lossHeaderWidth);
	let fieldWidth = Math.max(hopsHeaderWidth, hopWidth + FIELD_PADDING);

	if (hopOffset + fieldWidth + 2 * FIELD_GAP_WIDE < X_POS_THRESHOLD) {
		lossOffset += FIELD_GAP_WIDE;
		hopOffset += 2 * FIELD_GAP_WIDE;
	} else {
		lossOffset += FIELD_GAP_NARROW;
		hopOffset += 2 * FIELD_GAP_NARROW;
	}

	return {
		latencyRange,
		lossRange,
		hopRange,
		target,
		location,
		latencyWidth,
		lossWidth,
		probes,
		locationWidth,
		lossOffset,
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

		let { latencyRange, lossRange, latencyWidth } = getFieldContents(viableData);
		maxLatencyWidth = Math.max(maxLatencyWidth, latencyWidth);

		return {
			target,
			latencyRange,
			lossRange,
		};
	});

	let latencyOffset = START_X_POS + maxTargetWidth + 1.5 * FIELD_GAP_WIDE;
	let lossOffset = latencyOffset + maxLatencyWidth + FIELD_GAP_WIDE;

	return {
		targets,
		location,
		probes,
		latencyOffset,
		lossOffset,
		locationWidth,
	};
}

module.exports = async (ctx, data) => {
	if (data.length === 1) {
		return ctx.render('open-graph/gp-mtr.svg', prepareData(data[0]));
	}

	return ctx.render('open-graph/gp-mtr-comp.svg', prepareComparisonData(data));
};
