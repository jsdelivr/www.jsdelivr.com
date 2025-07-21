const got = require('../../../lib/got');
const _ = require('lodash');

const GLOBALPING_API_HOST = 'https://api.globalping.io';

const formatNumber = (number) => {
	if (number > 0 && number < 1) {
		return '1';
	}

	return number.toFixed(0);
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

module.exports.fetchGlobalpingStats = async (id, env) => {
	try {
		let measurementId = id.split(',')[0].split('.')[0];

		if (!measurementId) {
			return undefined;
		}

		return got.get(`${GLOBALPING_API_HOST}/v1/measurements/${measurementId}`).json();
	} catch (e) {
		if (env === 'development') {
			console.error(e);
		}

		return undefined;
	}
};

module.exports.getRangeString = (array) => {
	let filtered = removeOutliers(array.filter(_.isFinite));

	if (!filtered.length) {
		return '--';
	}

	let min = formatNumber(Math.min(...filtered));
	let max = formatNumber(Math.max(...filtered));

	return min === max ? min : min + ' - ' + max;
};

module.exports.getStatusCodes = (array, includeError = true) => {
	let filtered = array.filter(val => typeof val.result?.statusCode === 'number');

	let err = array.length - filtered.length;
	let statusCountMap = _.countBy(filtered, 'result.statusCode');

	if (err && includeError) {
		statusCountMap.Error = err;
	}

	let sortedCodes = _.sortBy(Object.keys(statusCountMap), code => statusCountMap[code]).reverse();
	sortedCodes = sortedCodes.map(code => ({ code, count: statusCountMap[code] }));

	return sortedCodes;
};
