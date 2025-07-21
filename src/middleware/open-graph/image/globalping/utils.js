const { truncateString, fontsProcessor } = require('../utils');

const START_X_POS = 88;
const X_POS_THRESHOLD = 960;

const FIELD_GAP_WIDE = 64;
const FIELD_GAP_NARROW = 32;
const FIELD_PADDING = 32;

const getLocationString = (locations) => {
	let locationStr = locations.map((location) => {
		return Object.values(location).join('+').trim();
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

module.exports = {
	getLocationString,
	getBaseInfo,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_PADDING,
	FIELD_GAP_WIDE,
	FIELD_GAP_NARROW,
};
