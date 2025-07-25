const { truncateString, fontsProcessor } = require('../utils');
const { pluralize } = require('../../../../assets/js/_');

const START_X_POS = 88;
const X_POS_THRESHOLD = 960;

const FIELD_GAP_WIDE = 64;
const FIELD_GAP_NARROW = 32;
const FIELD_PADDING = 32;

const FIELD_TYPES = {
	HEADER: 'header',
	BIGGER: 'bigger',
	SMALLER: 'smaller',
	REGULAR: 'regular',
	NO_SPACING: 'no-spacing',
	TARGET: 'target',
	PATH: 'path',
	DEFAULT: 'default',
};

const FIELD_OPTIONS = {
	[FIELD_TYPES.HEADER]: {
		fontFamily: 'Lexend Regular',
		fontSize: 30,
		letterSpacing: 0,
	},
	[FIELD_TYPES.BIGGER]: {
		fontFamily: 'Lexend SemiBold',
		fontSize: 34,
		letterSpacing: -0.6,
	},
	[FIELD_TYPES.SMALLER]: {
		fontFamily: 'Lexend Regular',
		fontSize: 30,
		letterSpacing: -0.6,
	},
	[FIELD_TYPES.REGULAR]: {
		fontFamily: 'Lexend Regular',
		fontSize: 32,
		letterSpacing: -0.6,
	},
	[FIELD_TYPES.NO_SPACING]: {
		fontFamily: 'Lexend SemiBold',
		fontSize: 32,
		letterSpacing: 0,
	},
	[FIELD_TYPES.TARGET]: {
		fontFamily: 'Lexend SemiBold',
		fontSize: 72,
		letterSpacing: 0,
	},
	[FIELD_TYPES.DEFAULT]: {
		fontFamily: 'Lexend SemiBold',
		fontSize: 32,
		letterSpacing: -0.6,
	},
	[FIELD_TYPES.PATH]: {
		fontFamily: 'Lexend SemiBold',
		fontSize: 30,
		letterSpacing: -0.6,
	},
};

function getFieldOptions (type) {
	return FIELD_OPTIONS[type] || FIELD_OPTIONS[FIELD_TYPES.DEFAULT];
}

const truncateField = (text, maxWidth, type) => {
	let { fontFamily, fontSize, letterSpacing } = getFieldOptions(type);
	return truncateString(text, fontFamily, fontSize, maxWidth, letterSpacing).text;
};

const getFieldWidth = (text, type) => {
	let { fontFamily, fontSize, letterSpacing } = getFieldOptions(type);
	return fontsProcessor.computeWidth(text, fontFamily, fontSize, letterSpacing);
};

const getHeaderWidths = (...headers) => headers.map(header => getFieldWidth(header, FIELD_TYPES.HEADER));

const getLocationString = (locations) => {
	if (!locations) {
		return '';
	}

	let locationStr = locations.map((location) => {
		return Object.values(location).join('+').trim();
	}).join(', ');

	return truncateField(locationStr, 550, FIELD_TYPES.NO_SPACING);
};

const getBaseInfo = (data) => {
	let location = getLocationString(data.locations);
	let locationWidth = getFieldWidth(location);
	let probes = `${data.results.length} ${pluralize('probe', data.results.length)}`;
	let target = truncateField(data.target, 750, FIELD_TYPES.TARGET);

	return { location, locationWidth, probes, target };
};

const getBaseComparisonInfo = (data) => {
	let location = getLocationString(data[0].locations);
	let locationWidth = getFieldWidth(location);
	let probes = `${data[0].results.length} ${pluralize('probe', data[0].results.length)}`;

	return { location, locationWidth, probes };
};

const getTargetField = (data) => {
	let target = truncateField(data.target, 300);
	let targetWidth = getFieldWidth(target);

	return { target, targetWidth };
};

module.exports = {
	getLocationString,
	getBaseInfo,
	getBaseComparisonInfo,
	getTargetField,
	getHeaderWidths,
	getFieldWidth,
	truncateField,
	START_X_POS,
	X_POS_THRESHOLD,
	FIELD_PADDING,
	FIELD_GAP_WIDE,
	FIELD_GAP_NARROW,
	FIELD_TYPES,
};
