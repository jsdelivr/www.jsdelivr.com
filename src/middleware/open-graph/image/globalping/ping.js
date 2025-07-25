const { getRangeString, getViableData } = require('../../utils/globalping');

const {
	getBaseInfo,
	getBaseComparisonInfo,
	getTargetField,
	getHeaderWidths,
	getFieldWidth,
	START_X_POS,
	FIELD_GAP_WIDE,
	FIELD_PADDING,
} = require('./utils');

function getFieldContents (data) {
	let latencyRange = `${getRangeString(data.map(obj => obj.result.stats?.avg))} ms`;
	let lossRange = `${getRangeString(data.map(obj => obj.result.stats?.loss))} %`;

	return {
		latencyRange,
		lossRange,
		latencyWidth: getFieldWidth(latencyRange),
		lossWidth: getFieldWidth(lossRange),
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

	let { latencyRange, lossRange, latencyWidth, lossWidth } = getFieldContents(viableData);

	let fieldWidth = Math.max(latencyWidth + FIELD_PADDING, ...getHeaderWidths('Avg latency:'));
	let lossOffset = START_X_POS + FIELD_GAP_WIDE + fieldWidth;

	return {
		latencyRange,
		lossRange,
		target,
		location,
		latencyWidth,
		lossWidth,
		probes,
		locationWidth,
		lossOffset,
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
		locationWidth,
		latencyOffset,
		lossOffset,
	};
}

module.exports = async (ctx, data) => {
	if (data.length === 1) {
		return ctx.render('open-graph/gp-ping.svg', prepareData(data[0]));
	}

	return ctx.render('open-graph/gp-ping-comp.svg', prepareComparisonData(data));
};
