const { truncateString, fontsProcessor } = require('../utils');

const START_X_POS = 88;
const X_POS_THRESHOLD = 960;

const FIELD_GAP_WIDE = 64;
const FIELD_GAP_NARROW = 32;
const FIELD_PADDING = 32;

const formatNumber = (number) => {
	if (number > 0 && number < 1) {
		return '1';
	}

	return number.toFixed(0);
};

const getRangeString = (array) => {
	let filtered = removeOutliers(array.filter(_.isFinite));
	let min = formatNumber(Math.min(...filtered));
	let max = formatNumber(Math.max(...filtered));

	return min === max ? min : min + ' - ' + max;
};

const getLocationString = (locations) => {
	let locationStr = locations.map((location) => {
		return Object.values(location).join('+');
	}).join(', ');

	return truncateString(locationStr, 'Lexend SemiBold', 32, 550).text;
};

const getBaseInfo = (data) => {
	let location = getLocationString(data.locations);
	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);
	let probes = `${data.results.length} probe${data.results.length > 1 ? 's' : ''}`;
	let target = truncateString(data.target, 'Lexend SemiBold', 72, 750).text;

	return { location, locationWidth, probes, target };
};

// Based on https://en.wikipedia.org/wiki/Interquartile_range#Outliers:~:text=be%20indicated%20here.-,Outliers,-%5Bedit%5D
const removeOutliers = (array) => {
	let len = array.length;
	array.sort((a, b) => a - b);

	if (len < 10) {
		return array;
	}

	let q1 = array[Math.floor(len * 0.25)];
	let q3 = array[Math.floor(len * 0.75)];
	let iqr = q3 - q1;

	let upperBound = q3 + 1.5 * iqr;
	let lowerBound = q1 - 1.5 * iqr;

	return array.filter(val => (val >= lowerBound) && (val <= upperBound));
};

module.exports = {
	getLocationString,
	getRangeString,
	getBaseInfo,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_PADDING,
	FIELD_GAP_WIDE,
	FIELD_GAP_NARROW,
};
