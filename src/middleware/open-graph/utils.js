const path = require('path');
const entities = require('entities');

const FontsProcessor = require('./fonts');
const fontsProcessor = new FontsProcessor();

fontsProcessor.addFontSync('Lexend Regular', path.resolve(__dirname, '../../../fonts/Lexend-Regular.ttf'));
fontsProcessor.addFontSync('Lexend SemiBold', path.resolve(__dirname, '../../../fonts/Lexend-SemiBold.ttf'));

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

module.exports = {
	cleanString,
	truncateString,
	fontsProcessor,
};
