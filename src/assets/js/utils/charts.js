const createBarChart = require('./create-bar-chart');
const createLineChart = require('./create-line-chart');

module.exports = () => {
	return Promise.all([
		// eslint-disable-next-line node/no-missing-import
		import('https://cdn.jsdelivr.net/npm/chart.js@3.9.1/+esm'),
	]).then(([
		{
			Chart,
			ArcElement,
			LineElement,
			BarElement,
			PointElement,
			BarController,
			BubbleController,
			DoughnutController,
			LineController,
			PieController,
			PolarAreaController,
			RadarController,
			ScatterController,
			CategoryScale,
			LinearScale,
			LogarithmicScale,
			RadialLinearScale,
			TimeScale,
			TimeSeriesScale,
			Decimation,
			Filler,
			Legend,
			Title,
			Tooltip,
		},
	]) => {
		Chart.register(
			ArcElement,
			LineElement,
			BarElement,
			PointElement,
			BarController,
			BubbleController,
			DoughnutController,
			LineController,
			PieController,
			PolarAreaController,
			RadarController,
			ScatterController,
			CategoryScale,
			LinearScale,
			LogarithmicScale,
			RadialLinearScale,
			TimeScale,
			TimeSeriesScale,
			Decimation,
			Filler,
			Legend,
			Title,
			Tooltip
		);

		return {
			createBarChart: createBarChart(Chart),
			createLineChart: createLineChart(Chart),
		};
	});
};
