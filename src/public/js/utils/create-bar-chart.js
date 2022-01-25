const _ = require('../_');

// chartEl - canvas element
// chartData (labels, datasets) - data to render within the chart
// chartSettings - additional params for the chart
//	chartSettings.onHoverNotActiveBarsBGColor - all bars color except the hovered one
//	chartSettings.useYAxisBorderPlugin - use plugin to render vertical y-axis border
//	chartSettings.useExternalTooltip - use custom external tooltip instead of default one
// chartConfig - config of the chart(chartjs lib config)

function createBarChart (chartEl, chartData = {}, chartSettings = { useExternalTooltip: false }, chartConfig = {}) {
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
		chart.config._config.options.elements.bar.backgroundColor = chartSettings.onHoverNotActiveBarsBGColor || '#FAE5E0';
		chart.update();
	};

	// handle mouse out of the chart area to restore bar colors
	let chartMouseOutHandler = {
		id: 'chartMouseOutHandler',
		afterEvent (chart, args) {
			let { event } = args;

			if (event.type === 'mouseout') {
				event.native.target.style.cursor = 'default';
				chart.config._config.options.elements.bar.backgroundColor = chartConfig?.options?.elements?.bar.backgroundColor || createBarWithGradient(chartEl);
				chart.update();
			}
		},
	};

	// create vertical y-axis border line
	let verticalYAxisBorder = {
		id: 'statsChartYBorder',
		beforeDraw (chart) {
			let { ctx } = chart;
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(89, 0);
			ctx.lineTo(89, 290);
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#DADDE2';
			ctx.stroke();
			ctx.restore();
		},
	};

	// create external tooltip
	let externalTooltip = (ctx) => {
		let { chart, tooltip: tooltipModel } = ctx;
		let tooltipInstance = document.getElementById('barChart-tooltip');
		console.log('++++++ chart', chart);
		console.log('++++++ tooltipModel', tooltipModel);
		console.log('+___________________________________');

		// Create element on first render
		if (!tooltipInstance) {
			tooltipInstance = document.createElement('div');
			tooltipInstance.id = 'barChart-tooltip';
			tooltipInstance.classList.add('tooltipEl');
			let wrapper = document.createElement('div');
			wrapper.classList.add('tooltipWrapper');
			tooltipInstance.appendChild(wrapper);
			chart.canvas.parentNode.appendChild(tooltipInstance);
		}

		// Hide if no tooltip
		if (tooltipModel.opacity === 0) {
			tooltipInstance.style.opacity = 0;
			return;
		}

		tooltipInstance.style.opacity = 1;
		tooltipInstance.style.top = 0;
		tooltipInstance.style.left = 0;
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
					enable: true,
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
			onHover: handleChartOnHover,
		},
		plugins: getChartPlugins(),
	};

	// create chart instance
	return new Chart(chartEl, defaultConfig);
}


module.exports = createBarChart;
