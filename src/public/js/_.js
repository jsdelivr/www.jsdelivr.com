const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

module.exports = {
	flattenFiles: function flattenFiles (tree, path = '/', files = []) {
		tree.forEach((item) => {
			if (item.type === 'file') {
				files.push(path + item.name);
			} else {
				flattenFiles(item.files, path + item.name + '/', files);
			}
		});

		return files;
	},
	formatDate (date) {
		return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
	},
	formatHits (hits) {
		if (hits < 1e9) {
			return 1;
		}

		return Math.round(hits / 1e9);
	},
	formatMiB2TiB (mb) {
		return Math.floor(mb / 1024 / 1024 / 10) * 10;
	},
	formatNumber (number) {
		return Math.floor(number).toString().replace(/\d(?=(?:\d{3})+$)/g, '$& ');
	},
	getMinifiedName (name) {
		return name.replace(/\.(js|css)$/i, '.min.$1');
	},
	getNonMinifiedName (name) {
		return name.replace(/\.min\.(js|css)$/i, '.$1');
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
	linRange (max, number) {
		let array = [];

		for (let i = 1; i <= number; i++) {
			array.push(max * i / number);
		}

		return array;
	},
	logRange (min, max) {
		let array = [];

		for (let i = min; i <= max; i *= 10) {
			array.push(i);
		}

		return array;
	},
	multiplyDeep: function multiplyDeep (data, n) {
		if (typeof data !== 'object') {
			return data;
		}

		Object.keys(data).forEach((key) => {
			if (key !== 'rank' && typeof data[key] === 'number') {
				data[key] *= n;
			} else if (data[key] && typeof data[key] === 'object') {
				multiplyDeep(data[key], n);
			}
		});

		return data;
	},
	nth (n) {
		n = Math.floor(n);
		let m = n % 10;

		if (n === 1) {
			return '';
		} else if (n > 20 && m === 1) {
			return `${n}st`;
		} else if (n === 2 || (n > 20 && m === 2)) {
			return `${n}nd`;
		} else if (n === 3 || (n > 20 && m === 3)) {
			return `${n}rd`;
		}

		return `${n}th`;
	},
	getPackageTabChartXData (periodDates) {
		let chartXDates = {
			// all days during period
			periodDays: [],
			// all months during period
			periodMonths: [],
		};

		periodDates.forEach((date) => {
			let splittedDate = date.split('-');
			let dateDay = splittedDate.slice(-1)[0];
			let dateMonth = splittedDate.slice(0, 2).join('-');
			let periodMonthFormatted = months[new Date(dateMonth).getUTCMonth()];

			if (!chartXDates[periodMonthFormatted]) {
				chartXDates[periodMonthFormatted] = [];
			}

			chartXDates[periodMonthFormatted].push(dateDay);
			chartXDates.periodDays.push(dateDay);

			if (chartXDates.periodMonths.indexOf(periodMonthFormatted) === -1) {
				chartXDates.periodMonths.push(periodMonthFormatted);
			}
		});

		return chartXDates;
	},
	// escaping code: https://github.com/component/escape-html/blob/master/index.js
	unescapeHtml (text) {
		return text
			.replace(/&quot;/g, '"')
			.replace(/&amp;/g, '&')
			.replace(/&#39;/g, '\'')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>');
	},
};
