const got = require('../../../lib/got');

const GLOBALPING_API_HOST = 'https://api.globalping.io';
const MEASUREMENT_TYPES = [ 'ping', 'traceroute', 'mtr', 'dns', 'http' ];

function formatNumber (number) {
	if (number > 0 && number < 1) {
		return '1';
	}

	return number.toFixed(0);
}

// Based on https://en.wikipedia.org/wiki/Interquartile_range#Outliers:~:text=be%20indicated%20here.-,Outliers,-%5Bedit%5D
function removeOutliers (array) {
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
}

module.exports.validateMeasurementData = (data, allowInProgress = true) => {
	let baseValidation = data && data.length
		&& data.every(meas => MEASUREMENT_TYPES.includes(meas.type))
		&& (allowInProgress || data.every(meas => meas.status === 'finished'));

	if (data?.length === 1) {
		return baseValidation;
	} else if (data?.length === 2) {
		let [ firstMeas, secMeas ] = data;

		let baseComparisonValidation = firstMeas.type === secMeas.type
			&& firstMeas.probesCount === secMeas.probesCount
			&& _.isEqual(firstMeas.measurementOptions, secMeas.measurementOptions)
			&& _.isEqual(firstMeas.locations, secMeas.locations);

		return baseValidation && baseComparisonValidation;
	}

	return false;
};

module.exports.fetchGlobalpingStats = async (id, env) => {
	try {
		let ids = id.split(',');

		if (!ids || !ids.length) {
			return undefined;
		}

		return Promise.all(ids.slice(0, 2).map(id => got.get(`${GLOBALPING_API_HOST}/v1/measurements/${id.split('.')[0]}`).json()));
	} catch (e) {
		if (env === 'development') {
			console.error(e);
		}

		return undefined;
	}
};

module.exports.getViableData = (data) => {
	switch (data.type) {
		case 'ping': {
			return data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result.stats?.avg));
		}

		case 'traceroute': {
			return data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops?.at(-1).timings.length);
		}

		case 'mtr': {
			return data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result.hops?.at(-1).stats?.avg));
		}

		case 'dns': {
			if (data.measurementOptions?.trace) {
				return data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops.length);
			}

			return data.results.filter(obj => obj.result.status === 'finished');
		}

		case 'http': {
			return data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result?.timings?.total) && obj.result?.statusCode);
		}

		default: {
			return data.results.filter(obj => obj.result.status === 'finished');
		}
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

module.exports.getStatusCodes = (array) => {
	let filtered = array.filter(val => typeof val.result?.statusCode === 'number');

	let err = array.length - filtered.length;
	let statusCountMap = _.countBy(filtered, 'result.statusCode');

	if (err) {
		statusCountMap.Error = err;
	}

	let sortedCodes = _.sortBy(Object.keys(statusCountMap), code => statusCountMap[code]).reverse();
	sortedCodes = sortedCodes.map(code => ({ code, count: statusCountMap[code] }));

	return sortedCodes;
};
