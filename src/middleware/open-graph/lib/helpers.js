const entities = require('entities');
const FontsProcessor = require('../fonts');
const path = require('path');

const START_X = 88;
const MAX_X = 960;

const FIELD_GAP_WIDE = 64;
const FIELD_GAP_NARROW = 32;
const FIELD_PADDING = 32;

const formatNumber = (number) => {
	if (number > 0 && number < 1) {
		return '1';
	}

	return number.toFixed(0);
};

const makeRangeString = (low, high) => {
	return low === high ? low : low + ' - ' + high;
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

const getNumberRange = (array) => {
	let filtered = removeOutliers(array.filter(val => typeof val === 'number'));
	return makeRangeString(formatNumber(Math.min(...filtered)), formatNumber(Math.max(...filtered)));
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
	let probes = data.results.length + ' probe' + ((data.results.length > 1) && 's');
	let target = truncateString(data.target, 'Lexend SemiBold', 72, 750).text;

	return { location, locationWidth, probes, target };
};

const getStatusCodes = (array) => {
	let statusCountMap = {};
	let filtered = array.filter(val => typeof val.result?.statusCode === 'number');

	let err = array.length - filtered.length;

	filtered.forEach((item) => {
		let code = item.result.statusCode?.toString();

		if (code in statusCountMap) {
			statusCountMap[code]++;
		} else {
			statusCountMap[code] = 1;
		}
	});

	if (err) {
		statusCountMap.Error = err;
	}

	let sortedCodes = _.sortBy(Object.keys(statusCountMap), code => statusCountMap[code]).reverse();
	sortedCodes = sortedCodes.map(code => ({ code, count: statusCountMap[code] }));

	return sortedCodes;
};

/**
 *
 * @param {string} input
 * @returns {string}
 */
const cleanString = (input) => {
	return entities.decodeHTML(input).replace(/\p{Cc}/gu, '');
};

/**
 * @param {string} input
 * @param {string} fontFamily
 * @param {number} fontSize
 * @param {number} maxWidth
 * @param {number} letterSpacing
 * @return {{width: number, text: string}}
 */
const truncateString = (input, fontFamily, fontSize, maxWidth, letterSpacing = 0) => {
	let width = str => fontsProcessor.computeWidth(str, fontFamily, fontSize, letterSpacing);
	let truncate = (str) => {
		let strWidth = width(str);
		let dotsWidth = width('...');

		if (strWidth <= maxWidth) {
			return { text: str, width: strWidth };
		}

		while (strWidth > maxWidth - dotsWidth) {
			str = str.substr(0, str.length - 1);
			strWidth = width(str);
		}

		return { text: str + '...', width: strWidth + dotsWidth };
	};

	return truncate(cleanString(input));
};

const fontsProcessor = new FontsProcessor();
fontsProcessor.addFontSync('Lexend Regular', path.resolve(__dirname, '../../../../fonts/Lexend-Regular.ttf'));
fontsProcessor.addFontSync('Lexend SemiBold', path.resolve(__dirname, '../../../../fonts/Lexend-SemiBold.ttf'));

module.exports = { getLocationString, getNumberRange, truncateString, getStatusCodes, getBaseInfo, fontsProcessor, MAX_X, START_X, FIELD_PADDING, FIELD_GAP_WIDE, FIELD_GAP_NARROW };
