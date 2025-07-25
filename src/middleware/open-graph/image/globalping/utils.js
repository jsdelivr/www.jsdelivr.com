const { truncateString, fontsProcessor } = require('../utils');
const { pluralize } = require('../../../../assets/js/_');

const START_X_POS = 88;
const X_POS_THRESHOLD = 960;

const FIELD_GAP_WIDE = 64;
const FIELD_GAP_NARROW = 32;
const FIELD_PADDING = 32;

const getHeaderWidths = (...headers) => headers.map(header => fontsProcessor.computeWidth(header, 'Lexend Regular', 30, 0));

const getLocationString = (locations) => {
	if (!locations) {
		return '';
	}

	let locationStr = locations.map((location) => {
		return Object.values(location).join('+').trim();
	}).join(', ');

	return truncateString(locationStr, 'Lexend SemiBold', 32, 550).text;
};

const getBaseInfo = (data) => {
	let location = getLocationString(data.locations);
	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);
	let probes = `${data.results.length} ${pluralize('probe', data.results.length)}`;
	let target = truncateString(data.target, 'Lexend SemiBold', 72, 750).text;

	return { location, locationWidth, probes, target };
};

const getBaseComparisonInfo = (data) => {
	let location = getLocationString(data[0].locations);
	let locationWidth = fontsProcessor.computeWidth(location, 'Lexend SemiBold', 32, -0.6);
	let probes = `${data[0].results.length} ${pluralize('probe', data[0].results.length)}`;

	return { location, locationWidth, probes };
};

const getTargetField = (data) => {
	let target = truncateString(data.target, 'Lexend SemiBold', 32, 300, -0.6).text;
	let targetWidth = fontsProcessor.computeWidth(target, 'Lexend SemiBold', 32, -0.6);

	return { target, targetWidth };
};

module.exports = {
	getLocationString,
	getBaseInfo,
	getBaseComparisonInfo,
	getTargetField,
	getHeaderWidths,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_PADDING,
	FIELD_GAP_WIDE,
	FIELD_GAP_NARROW,
};
