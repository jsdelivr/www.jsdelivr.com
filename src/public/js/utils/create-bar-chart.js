const _ = require('../_');

// chartEl - canvas element
// chartData (labels, datasets) - data to render within the chart
// chartSettings - additional params for the chart
//	chartSettings.onHoverNotActiveBarsBGColor - all bars color except the hovered one
//	chartSettings.useYAxisBorderPlugin - use plugin to render vertical y-axis border
//	chartSettings.useExternalTooltip - use custom external tooltip instead of default one
// 	chartSettings.externalTooltipId - if there are more than one barChart on the page you should set different ids for tooltips
// chartConfig - config of the chart(chartjs lib config)

function createBarChart (
	chartEl,
	chartData = {},
	chartSettings = {},
	chartConfig = {}
) {
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
			ctx.moveTo(chartArea.left - 8, 32);
			ctx.lineTo(chartArea.left - 8, 322);
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#DADDE2';
			ctx.stroke();
			ctx.restore();
		},
	};

	// create external tooltip
	let externalTooltip = (ctx) => {
		let { chart, tooltip: tooltipModel } = ctx;
		let tooltipInstance = document.getElementById(chartSettings.externalTooltipId || 'barChart-tooltip');

		// Create element on first render
		if (!tooltipInstance) {
			tooltipInstance = document.createElement('div');
			tooltipInstance.id = chartSettings.externalTooltipId || 'barChart-tooltip';
			tooltipInstance.classList.add('tooltipEl');
			let wrapper = document.createElement('div');
			wrapper.classList.add('barTooltipWrapper');
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
			let innerHtml = `<span>${bodyValue}</span>`;
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
					external: chartSettings.useExternalTooltip ? externalTooltip : null,
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
							// TODO: for future use, to return measurement units e.g.
							// return `${formattedValue} GB`;
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
				intersect: true,
				...chartConfig?.options?.intercation,
			},
			onHover: handleChartOnHover,
		},
		plugins: getChartPlugins(),
	};

	// create chart instance
	return new Chart(chartEl, defaultConfig);
}


module.exports = createBarChart;
