const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

module.exports = {
	formatDate (date) {
		return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
	},
	formatHits (hits) {
		if (hits < 1e9) {
			return 1;
		}

		return Math.round(hits / 1e9);
	},
	formatMB (mb) {
		return Math.floor(mb / 1024 / 1024 / 10) * 10;
	},
	formatNumber (number) {
		return Math.floor(number).toString().replace(/\d(?=(?:\d{3})+$)/g, '$& ');
	},
	listFiles: function listFiles (files = [], path) {
		if (!path.length) {
			return files;
		}

		let p = path.slice();
		let n = p.shift();
		let d = files.filter(f => f.name === n)[0];

		return d && d.files ? listFiles(d.files, p) : null;
	},
};
