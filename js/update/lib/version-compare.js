// based on https://github.com/mikeauclair/version_sorter/blob/master/version_sorter.rb
var dPattern = /^[1-9]\d*$/;
var pPattern = /([-.]|\d+|[^-.\d]+)/g;
var tPattern = /[a-z]/;

module.exports = function versionCompare (versionA, versionB) {
	var ax = versionA.match(pPattern);
	var bx = versionB.match(pPattern);

	while (ax && bx && ax.length && bx.length) {
		var a = ax.shift();
		var b = bx.shift();

		if (a === b) {
			// continue
		} else if (a === '-' || a === '.') {
			return 1;
		} else if (b === '-' || b === '.') {
			return -1;
		} else if (dPattern.test(a) && dPattern.test(b)) {
			return b - a;
		} else {
			return compareStrings(a, b);
		}
	}

	return compareStrings(versionA, versionB);
};

function compareStrings (a, b) {
	a = a.toLowerCase();
	b = b.toLowerCase();

	// 1.0.0 > 1.0.0-alpha
	if (tPattern.test(a) && !tPattern.test(b)) {
		return 1;
	} else if (tPattern.test(b) && !tPattern.test(a)) {
		return -1;
	}

	return a > b ? -1 : a < b ? 1 : 0;
}
