const MIN_LABELS_GAP = 16;

let getLabelLines = label => [].concat(label);

let getFontString = ({ style, weight, size, family }) => [ style, weight, `${size}px`, family ].filter(Boolean).join(' ');

let areColliding = (scale, ctx, leftIdx, rightIdx) => {
	let [ leftWidth, rightWidth ] = [ leftIdx, rightIdx ].map((idx) => {
		return Math.max(...getLabelLines(scale.ticks[idx].label).map(line => ctx.measureText(line).width));
	});

	return scale.getPixelForTick(rightIdx) - scale.getPixelForTick(leftIdx) - (leftWidth + rightWidth) / 2 < MIN_LABELS_GAP;
};

module.exports = {
	id: 'hideCollidingEdgeLabels',
	afterLayout (chart) {
		let scale = chart.scales.x;

		if (!scale || !scale.options.display || !scale.options.ticks.display) {
			return;
		}

		// charts labeling every bar are evenly spaced and Chart.js rotates their labels when crowded
		if (scale.getLabels().every(label => label.length)) {
			return;
		}

		let { ctx } = chart;

		ctx.save();
		ctx.font = getFontString(scale.options.ticks.font);

		if (scale.ticks.length >= 2 && areColliding(scale, ctx, 0, 1)) {
			let [ firstTick, secondTick ] = scale.ticks;
			let secondLines = getLabelLines(secondTick.label);

			// keep the starting year shown by the hidden first label
			secondTick.label = [ ...secondLines, ...getLabelLines(firstTick.label).slice(secondLines.length) ];
			scale.ticks.shift();
		}

		if (scale.ticks.length >= 3 && areColliding(scale, ctx, scale.ticks.length - 2, scale.ticks.length - 1)) {
			scale.ticks.pop();
		}

		ctx.restore();
	},
};
