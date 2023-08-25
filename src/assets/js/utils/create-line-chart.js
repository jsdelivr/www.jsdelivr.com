const _ = require('../_');

// chartEl - canvas element
// chartData (labels, datasets) - data to render within the chart
// chartSettings - additional params for the chart
//	chartSettings.useYAxisBorderPlugin - use plugin to render vertical y-axis border
//	chartSettings.useExternalTooltip - use custom external tooltip instead of default one
// chartConfig - config of the chart(chartjs lib config)

const createLineChart = Chart => (
	chartEl,
	chartData = {},
	chartSettings = { useExternalTooltip: false },
	chartConfig = {},
) => {
	// remove tooltip elem if chart was recreated (e.g. after screen resizing)
	let prevTooltipInstance = document.getElementById('lineChart-tooltip');

	if (prevTooltipInstance) {
		prevTooltipInstance.remove();
	}

	if (!chartEl) { return; }

	// TODO: Statistics page only, should be rechecked and fix if needed
	// create external tooltip (prev version)
	let externalTooltipOldVersion = (ctx) => {
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

			// prepare body lines and color map for lines-backgrounds
			let bodyData = tooltipModel.body.reduce((res, item, itemIdx) => {
				res.lines.push(item.lines[0]);
				res.linesMap[item.lines[0]] = tooltipModel.labelColors[itemIdx].backgroundColor;
				return res;
			}, { lines: [], linesMap: {} });

			// sort body lines from max to min
			let sortedBodyLines = bodyData.lines.sort((a, b) => b.split(': ')[1].replace(/,/g, '') - a.split(': ')[1].replace(/,/g, ''));

			// create title element
			let innerHtml = `<div class='tooltipTitle'>${titleText}</div><div class='tooltipBody'>`;

			// create body lines
			sortedBodyLines.forEach((line) => {
				let coloredSquare = `<span class='tooltipSquare' style='background: ${bodyData.linesMap[line]}'></span>`;
				innerHtml += `<div class='tooltipBodyItem'>${coloredSquare}`;

				line.split(' ').forEach((part, partIdx) => {
					let prepPart = part;

					if (partIdx === 0) {
						prepPart = prepPart.replace(':', '');
					} else {
						prepPart = prepPart.replaceAll(',', ' ');
					}

					innerHtml += `<span>${prepPart}</span>`;
				});

				innerHtml += '</div>';

				let provider = line.split(' ')[0].replace(':', '');
				let providerData = tooltipModel.dataPoints.find((one) => {
					return one.dataset.label === provider;
				});
				innerHtml += `<div class='ratio-text'>
					<span>Average file size</span>
					<span>${providerData.dataset.ratio[providerData.label.replace(',', '')]}</span>
				</div>`;
			});

			innerHtml += `</div>`;
			let tooltipWrapper = tooltipInstance.querySelector('div.tooltipWrapper');
			tooltipWrapper.innerHTML = innerHtml;
		}

		tooltipInstance.style.opacity = 1;
		let { canvas: { offsetLeft }, chartArea } = chart;

		let tooltipVerticalLine = tooltipInstance.querySelector('.tooltipVerticalLine');

		// caretX min 0 max 1110
		// 120px based on the half width of the tooltip + vertical line and gap
		if (tooltipModel.caretX > 882) {
			tooltipVerticalLine.style.left = '230px';
			tooltipInstance.style.left = -120 + offsetLeft + tooltipModel.caretX + 'px';
		} else {
			tooltipVerticalLine.style.left = '-10px';
			tooltipInstance.style.left = 120 + offsetLeft + tooltipModel.caretX + 'px';
		}

		tooltipVerticalLine.style.height = chartArea.height + 'px';
		tooltipInstance.style.top = chartArea.top + 'px';
	};

	// create external tooltip (new version)
	let externalTooltip = (ctx) => { // TODO: 507 (one-two columns layout for chart tooltip and maybe scrollable tooltip content for mobile)
		let { chart, tooltip: tooltipModel } = ctx;
		let tooltipInstance = document.getElementById('lineChart-tooltip');

		// Create element on first render
		if (!tooltipInstance) {
			tooltipInstance = document.createElement('div');
			tooltipInstance.id = 'lineChart-tooltip';
			tooltipInstance.classList.add('tooltipEl');
			let wrapper = document.createElement('div');
			wrapper.classList.add('tooltipWrapper', 'tooltipWrapper-improved');
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
			let [ periodStart, periodEnd ] = chartData.labelsStartEndPeriods[tooltipModel.dataPoints[0].parsed.x];
			let tooltipDate = _.createImprovedExternalTooltipTitle(periodStart, periodEnd, chartData.usageChartGroupBy);

			// prepare body lines and color map for lines-backgrounds
			let bodyData = tooltipModel.body.reduce((res, item, itemIdx) => {
				// add index to the key because content of the line could be cut and therefore they will ahve the same value which leads to bugs
				res.lines.push(itemIdx + item.lines[0]);
				res.linesMap[itemIdx + item.lines[0]] = tooltipModel.labelColors[itemIdx].backgroundColor;

				return res;
			}, { lines: [], linesMap: {} });

			// sort body lines from max to min
			let sortedBodyLines = bodyData.lines.sort((a, b) => b.split(': ')[1].replace(/,/g, '') - a.split(': ')[1].replace(/,/g, ''));

			// create title element
			let innerHtml = `<div class='tooltipTitle'>${tooltipDate}</div><div class='tooltipBody'><div class='tooltipBodyItemsWrapper'>`;

			// create body lines
			sortedBodyLines.forEach((line, idx) => {
				let coloredSquare = `<span class='tooltipSquare' style='background: ${bodyData.linesMap[line]}'></span>`;
				// remove first number character from the line because it is an index which is used to differentiate lines names in case if they were cut
				let [ iVersion, iAmount ] = line.replace(/^\d/, '').split(':');
				let formattedAmount = _.formatNumber(iAmount.replace(/\D/g, ''));

				if (idx === 10) {
					innerHtml += `</div><div class='tooltipBodyDivider'></div><div class='tooltipBodyItemsWrapper'>`;
				}

				innerHtml += `<div class='tooltipBodyItem'>${coloredSquare}`;
				innerHtml += `<span>${iVersion}</span><span>${formattedAmount + chartData.valueUnits}</span>`;
				innerHtml += '</div>';
			});

			let tooltipWrapper = tooltipInstance.querySelector('div.tooltipWrapper');
			tooltipWrapper.innerHTML = innerHtml;
		}

		tooltipInstance.style.opacity = 1;
		let { canvas, chartArea } = chart;

		let tooltipVerticalLine = tooltipInstance.querySelector('.tooltipVerticalLine');
		let tooltipWrapperEl = tooltipInstance.querySelector('div.tooltipWrapper');

		if (screen.width >= 992) {
			tooltipInstance.style.top = chartArea.top + 'px';
			tooltipVerticalLine.style.height = chartArea.height + 'px';

			if (tooltipModel.caretX + tooltipInstance.offsetWidth > canvas.clientWidth) {
				tooltipVerticalLine.style.left = tooltipInstance.offsetWidth + 10 + 'px';
				tooltipInstance.style.left = canvas.offsetLeft + tooltipModel.caretX - tooltipInstance.offsetWidth / 2 - 10 + 'px';
			} else {
				tooltipVerticalLine.style.left = '-10px';
				tooltipInstance.style.left = canvas.offsetLeft + tooltipModel.caretX + tooltipInstance.offsetWidth / 2 + 10 + 'px';
			}
		} else if (screen.width >= 768 && screen.width < 992) {
			tooltipInstance.style.top = chartArea.top + 'px';
			tooltipVerticalLine.style.height = chartArea.height + 'px';
			tooltipWrapperEl.style.position = 'absolute';
			tooltipWrapperEl.style.top = -tooltipWrapperEl.offsetHeight + tooltipVerticalLine.offsetHeight + 'px';

			if (tooltipModel.caretX + tooltipInstance.offsetWidth > canvas.clientWidth) {
				tooltipVerticalLine.style.left = tooltipInstance.offsetWidth + 10 + 'px';
				tooltipInstance.style.left = canvas.offsetLeft + tooltipModel.caretX - tooltipInstance.offsetWidth / 2 - 10 + 'px';
			} else {
				tooltipVerticalLine.style.left = '-10px';
				tooltipInstance.style.left = canvas.offsetLeft + tooltipModel.caretX + tooltipInstance.offsetWidth / 2 + 10 + 'px';
			}
		} else {
			tooltipInstance.style.top = chartArea.top + 'px';
			// tooltip data wrapper should be stick to the center
			tooltipWrapperEl.style.position = 'absolute';
			tooltipWrapperEl.style.left = canvas.clientWidth / 2 - tooltipWrapperEl.offsetWidth / 2 + 'px';
			tooltipWrapperEl.style.top = -tooltipWrapperEl.offsetHeight + 'px';
			// only vertical line is moving around the chart
			tooltipVerticalLine.style.height = chartArea.height + 'px';
			tooltipVerticalLine.style.left = canvas.offsetLeft + tooltipModel.caretX - tooltipInstance.offsetLeft + 'px';
		}
	};

	// create vertical y-axis border line
	let verticalYAxisBorder = {
		id: 'lineChartYBorder',
		beforeDraw (chart) {
			let { ctx, chartArea } = chart;
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(chartArea.left - 20, 22);
			ctx.lineTo(chartArea.left - 20, 319);
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#DADDE2';
			ctx.stroke();
			ctx.restore();
		},
	};

	// get chart plugins
	let getChartPlugins = () => {
		let { useYAxisBorderPlugin } = chartSettings;
		let plugins = [];

		if (useYAxisBorderPlugin) {
			plugins.push(verticalYAxisBorder);
		}

		return plugins;
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
					external: !chartSettings.useExternalTooltip ? null : chartSettings.useImprovedTooltip ? externalTooltip : externalTooltipOldVersion,
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
		plugins: getChartPlugins(),
	};

	// create chart instance
	return new Chart(chartEl, defaultConfig);
};

module.exports = createLineChart;
