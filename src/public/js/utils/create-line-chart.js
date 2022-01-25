// chartEl - canvas element
// chartData (labels, datasets) - data to render within the chart
// chartSettings - additional params for the chart
//	chartSettings.useExternalTooltip - use custom external tooltip instead of default one
// chartConfig - config of the chart(chartjs lib config)

function createLineChart (chartEl, chartData = {}, chartSettings = { useExternalTooltip: false }, chartConfig = {}) {
	if (!chartEl) { return; }

	// create external tooltip
	let externalTooltip = (ctx) => {
		let { chart, tooltip: tooltipModel } = ctx;

		let tooltipInstance = document.getElementById('lineChart-tooltip');

		// Create element on first render
		if (!tooltipInstance) {
			tooltipInstance = document.createElement('div');
			tooltipInstance.id = 'lineChart-tooltip';
			tooltipInstance.classList.add('tooltipEl');
			let wrapper = document.createElement('div');
			wrapper.classList.add('tooltipWrapper');
			tooltipInstance.appendChild(wrapper);
			let verticalLine = document.createElement('div');
			verticalLine.classList.add('tooltipVerticalLine');
			tooltipInstance.appendChild(verticalLine);
			chart.canvas.parentNode.appendChild(tooltipInstance);
		}

		// Hide if no tooltip
		if (tooltipModel.opacity === 0) {
			tooltipInstance.style.opacity = 0;
			return;
		}

		if (tooltipModel.body) {
			// get title text and body lines
			let titleText = new Date(tooltipModel.title[0].split(',')[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
			let bodyLines = tooltipModel.body.map(item => item.lines[0]);

			// create title element
			let innerHtml = `<div class='tooltipTitle'>${titleText}</div><div class='tooltipBody'>`;

			// create body lines
			bodyLines.forEach((line, lineIdx) => {
				let coloredSquare = `<span class='tooltipSquare' style='background: ${tooltipModel.labelColors[lineIdx].backgroundColor}'></span>`;
				innerHtml += `<div class='tooltipBodyItem'>${coloredSquare}`;

				line.split(' ').forEach((part, partIdx) => {
					let prepPart = part;

					if (partIdx === 0) {
						prepPart = prepPart.replace(':', '');
					}

					innerHtml += `<span>${prepPart}</span>`;
				});

				innerHtml += '</div>';
			});

			let tooltipWrapper = tooltipInstance.querySelector('div.tooltipWrapper');
			tooltipWrapper.innerHTML = innerHtml;
		}

		tooltipInstance.style.opacity = 1;
		let { canvas: { offsetLeft }, chartArea } = chart;

		let tooltipVerticalLine = tooltipInstance.querySelector('.tooltipVerticalLine');

		// caretX min 0 max 1110
		// 120px based on the half width of the tooltip + vertical line and gap
		if (tooltipModel.caretX > 882) {
			tooltipVerticalLine.style.left = '228px';
			tooltipInstance.style.left = -120 + offsetLeft + tooltipModel.caretX + 'px';
		} else {
			tooltipVerticalLine.style.left = '-8px';
			tooltipInstance.style.left = 120 + offsetLeft + tooltipModel.caretX + 'px';
		}

		tooltipVerticalLine.style.height = chartArea.height + 'px';
		tooltipInstance.style.top = chartArea.top + 'px';
	};

	// create vertical y-axis border line
	let verticalYAxisBorder = {
		id: 'lineChartYBorder',
		beforeDraw (chart) {
			let { ctx } = chart;
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(89, 0);
			ctx.lineTo(89, 297);
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#DADDE2';
			ctx.stroke();
			ctx.restore();
		},
	};

	// chart configuration
	let defaultConfig = {
		type: 'line',
		data: {
			labels: chartData.labels,
			datasets: chartData.datasets,
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			elements: {
				point: {
					pointRadius: 0,
					pointHoverRadius: 0,
				},
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: !chartSettings.useExternalTooltip && true,
					external: chartSettings.useExternalTooltip ? externalTooltip : null,
				},
			},
			scales: {
				x: {
					display: false,
					...chartConfig?.options?.scales?.x,
				},
				y: {
					display: false,
					...chartConfig?.options?.scales?.y,
				},
			},
			interaction: {
				axis: 'x',
				mode: 'nearest',
				intersect: false,
			},
		},
		plugins: [ verticalYAxisBorder ],
	};

	// create chart instance
	return new Chart(chartEl, defaultConfig);
}


module.exports = createLineChart;
