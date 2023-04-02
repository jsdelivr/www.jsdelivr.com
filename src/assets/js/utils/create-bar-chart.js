const _ = require('../_');

// chartEl - canvas element
// chartData (labels, datasets) - data to render within the chart
// chartSettings - additional params for the chart
//	chartSettings.onHoverNotActiveBarsBGColor - all bars color except the hovered one
//	chartSettings.useYAxisBorderPlugin - use plugin to render vertical y-axis border
//	chartSettings.useExternalTooltip - use custom external tooltip instead of default one
// 	chartSettings.externalTooltipId - if there are more than one barChart on the page you should set different ids for tooltips
// chartConfig - config of the chart(chartjs lib config)

const createBarChart = Chart => (
	chartEl,
	chartData = {},
	chartSettings = {},
	chartConfig = {},
) => {
	// remove tooltip elem if chart was recreated (e.g. after screen resizing)
	let prevTooltipInstance = document.getElementById(chartSettings.externalTooltipId || 'barChart-tooltip');

	if (prevTooltipInstance) {
		prevTooltipInstance.remove();
	}

	if (!chartEl) { return; }

	// create bar with background with gradient
	let createBarWithGradient = (chart) => {
		let barBackground = chart.getContext('2d').createLinearGradient(0, 0, 0, 300);
		barBackground.addColorStop(0, 'rgb(246, 81, 40)');
		barBackground.addColorStop(1, 'rgba(246, 81, 40, 0.08)');

		return barBackground;
	};

	// handle hover over the chart to change colors of the bars
	let handleChartOnHover = (event, elements, chart) => {
		if (elements.length !== 1) { return; }

		event.native.target.style.cursor = 'pointer';
		chart.options.elements.bar.backgroundColor = chartSettings.onHoverNotActiveBarsBGColor || '#FAE5E0';
		chart.update();
	};

	// handle mouse out of the chart area to restore bar colors
	let chartMouseOutHandler = {
		id: 'chartMouseOutHandler',
		afterEvent (chart, args) {
			let { event } = args;

			if (event.type === 'mouseout') {
				event.native.target.style.cursor = 'default';
				chart.options.elements.bar.backgroundColor = chartConfig?.options?.elements?.bar.backgroundColor || createBarWithGradient(chartEl);
				chart.update();
			}
		},
	};

	// create vertical y-axis border line
	let verticalYAxisBorder = {
		id: 'statsChartYBorder',
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

	// create external tooltip with Dates/Periods and value displaying
	let externalTooltipImproved = (ctx) => {
		let { chart, tooltip: tooltipModel } = ctx;
		let tooltipInstance = document.getElementById(chartSettings.externalTooltipId || 'barChart-tooltip');

		// Create element on first render
		if (!tooltipInstance) {
			tooltipInstance = document.createElement('div');
			tooltipInstance.id = chartSettings.externalTooltipId || 'barChart-tooltip';
			tooltipInstance.classList.add('tooltipEl');
			let wrapper = document.createElement('div');
			wrapper.classList.add('barTooltipWrapper', 'barTooltipWrapper-improved');
			tooltipInstance.appendChild(wrapper);
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

			let bodyValue = tooltipModel.body.map(item => item.lines[0])[0];
			let innerHtml = `<div>${tooltipDate}</div><div><span class='color-square'></span><span>${bodyValue}${chartData.valueUnits}</span></div>`;
			let tooltipWrapper = tooltipInstance.querySelector('div.barTooltipWrapper');
			tooltipWrapper.innerHTML = innerHtml;
		}

		tooltipInstance.style.opacity = 1;

		if (screen.width >= 768) {
			tooltipInstance.style.top = tooltipModel.caretY - (chartSettings.externalTooltipVerticalOffset || 0) + 'px';

			if (tooltipModel.caretX + tooltipInstance.offsetWidth > chart.canvas.clientWidth) {
				tooltipInstance.style.left = chart.canvas.offsetLeft + tooltipModel.caretX - tooltipInstance.offsetWidth / 2 - 10 + 'px';
			} else {
				tooltipInstance.style.left = chart.canvas.offsetLeft + tooltipModel.caretX + tooltipInstance.offsetWidth / 2 + 10 + 'px';
			}
		} else {
			tooltipInstance.style.left = chart.canvas.clientWidth / 2 + 'px';
			tooltipInstance.style.top = '0px';
		}
	};

	// create external tooltip with only value displaying
	let externalTooltipSimple = (ctx) => {
		let { chart, tooltip: tooltipModel } = ctx;
		let tooltipInstance = document.getElementById(chartSettings.externalTooltipId || 'barChart-tooltip');

		// Create element on first render
		if (!tooltipInstance) {
			tooltipInstance = document.createElement('div');
			tooltipInstance.id = chartSettings.externalTooltipId || 'barChart-tooltip';
			tooltipInstance.classList.add('tooltipEl');
			let wrapper = document.createElement('div');
			wrapper.classList.add('barTooltipWrapper', 'barTooltipWrapper-simple');
			tooltipInstance.appendChild(wrapper);
			chart.canvas.parentNode.appendChild(tooltipInstance);
		}

		// Hide if no tooltip
		if (tooltipModel.opacity === 0) {
			tooltipInstance.style.opacity = 0;
			return;
		}

		if (tooltipModel.body) {
			let bodyValue = tooltipModel.body.map(item => item.lines[0])[0];
			let innerHtml = `<span>${bodyValue}${chartData.valueUnits || ''}</span>`;
			let tooltipWrapper = tooltipInstance.querySelector('div.barTooltipWrapper');
			tooltipWrapper.innerHTML = innerHtml;
		}

		tooltipInstance.style.opacity = 1;
		tooltipInstance.style.top = tooltipModel.caretY - (chartSettings.externalTooltipVerticalOffset || 0) + 'px';
		tooltipInstance.style.left = chart.canvas.offsetLeft + tooltipModel.caretX + 'px';
	};

	// get chart plugins
	let getChartPlugins = () => {
		let { useYAxisBorderPlugin } = chartSettings;
		let plugins = [ chartMouseOutHandler ];

		if (useYAxisBorderPlugin) {
			plugins.push(verticalYAxisBorder);
		}

		return plugins;
	};

	// chart configuration
	let defaultConfig = {
		type: 'bar',
		data: {
			labels: chartData.labels,
			datasets: chartData.datasets,
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			elements: {
				bar: {
					backgroundColor: createBarWithGradient(chartEl),
					...chartConfig?.options?.elements?.bar,
				},
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: !chartSettings.useExternalTooltip && true,
					external: !chartSettings.useExternalTooltip ? null : chartSettings.useImprovedTooltip ? externalTooltipImproved : externalTooltipSimple,
					bodyColor: '#fff',
					backgroundColor: 'rgba(17, 26, 44, .9)',
					cornerRadius: 4,
					padding: 6,
					caretSize: 0,
					caretPadding: 8,
					bodyAlign: 'center',
					displayColors: false,
					xAlign: 'center',
					yAlign: 'bottom',
					bodyFont: {
						size: 12,
						weight: 600,
						family: 'Lexend, sans-serif',
						style: 'normal',
						lineHeight: 1.3,
					},
					callbacks: {
						title: () => {},
						footer: () => {},
						label: (ctx) => {
							let { formattedValue } = ctx;

							return _.formatNumber(formattedValue.replace(/\D/g, ''));
						},
					},
				},
			},
			scales: {
				x: {
					display: true,
					...chartConfig?.options?.scales?.x,
				},
				y: {
					display: true,
					...chartConfig?.options?.scales?.y,
				},
			},
			interaction: {
				intersect: false,
				mode: 'nearest',
				axis: 'x',
				...chartConfig?.options?.intercation,
			},
			onHover: handleChartOnHover,
		},
		plugins: getChartPlugins(),
	};

	// create chart instance
	return new Chart(chartEl, defaultConfig);
};

module.exports = createBarChart;
