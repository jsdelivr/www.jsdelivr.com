module.exports = {
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
};
