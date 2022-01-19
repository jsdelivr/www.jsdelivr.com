const _ = require('../_');

// chartEl - canvas element
// chartData (labels, datasets) - data to render within the chart
// chartSettings - additionalparams for the chart
//	chartSettings.onHoverNotActiveBarsBGColor - all bars color except the hovered one
// chartConfig - config of the chart(chartjs lib config), shallow merge

function createBarChart (chartEl, chartData = {}, chartSettings = {}, chartConfig = {}) {
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
				},
				y: {
					display: false,
				},
			},
			interaction: {
				axis: 'x',
				mode: 'nearest',
				intersect: false,
			},
			onHover: handleChartOnHover,
		},
		plugins: [ chartMouseOutHandler ],
	};

	// create chart instance
	return new Chart(chartEl, defaultConfig);
}


module.exports = createBarChart;
