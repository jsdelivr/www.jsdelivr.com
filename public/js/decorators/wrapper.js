var helpers = require('./helpers.js');
var tooltip = require('./tooltip.js');
var zeroClipboard = require('./zero-clipboard.js');

module.exports = helpers.combine([
	{ tooltip: tooltip },
	{ zeroClipboard: zeroClipboard }
]);