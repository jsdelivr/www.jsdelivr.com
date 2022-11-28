const MONTHS_SHORT_NAMES_LIST = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
const MONTHS_FULL_NAMES_LIST = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
const DAY_NAME_NUMBER_MAP = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const MONTH_FULL_OF_DAYS = '31';
const MONTH_SHORT_OF_DAYS = '30';
const MONTH_FEB_DAYS = '28';
const MONTH_LEAP_FEB_DAYS = '29';
const screenType = {
	mobile: 480,
	tablet: 768,
	mdDesktop: 992,
	lgDesktop: 1200,
	xlDesktop: 1400,
};

module.exports = {
	screenType,
	isTabletScreen () {
		return screen.width > screenType.mobile && screen.width <= screenType.tablet;
	},

	isMobileScreen () {
		return screen.width <= screenType.mobile;
	},

	calculateGrowth (curr, prev) {
		if (!prev) {
			return 0;
		}

		return Math.round((curr / prev) * 100 - 100);
	},

	getValueFormatter (isBandwidth, values) {
		if (!isBandwidth) {
			return module.exports.formatNumber;
		}

		let unit = module.exports.findUnitFromArray(values);
		return value => module.exports.formatBytesWithUnit(value, unit);
	},

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
		return `${MONTHS_SHORT_NAMES_LIST[date.getUTCMonth()]} ${date.getUTCDate()}`;
	},

	formatHits (hits) {
		if (hits < 1e9) {
			return 1;
		}

		return Math.round(hits / 1e9);
	},

	formatBytes2TiB (bytes) {
		return Math.round(bytes / 1.1e+12);
	},

	formatNumber (number) {
		return Math.floor(number).toString().replace(/\d(?=(?:\d{3})+$)/g, '$& ');
	},

	formatNumberWithSpace (val) {
		// remove sign if negative
		let sign = 1;

		if (val < 0) {
			sign = -1;
			val = -val;
		}

		let num = val.toString().includes('.') ? val.toString().split('.')[0] : val.toString();

		while (/(\d+)(\d{3})/.test(num.toString())) {
			num = num.toString().replace(/(\d+)(\d{3})/, '$1 $2');
		}

		if (val.toString().includes('.')) {
			num = num + '.' + val.toString().split('.')[1];
		}

		return sign < 0 ? '-' + num : num;
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

	getChartXAxisData (periodDates, period = 'month', periodGroupBy = 'day') {
		let chartXData = [];
		let dataPerMonths = periodDates.reduce((dataPerMonths, date) => {
			let splittedDate = date.split('-');
			let dateYear = splittedDate[0];
			let dateMonth = splittedDate.slice(0, 2).join('-');
			let periodMonthFormatted = MONTHS_SHORT_NAMES_LIST[new Date(dateMonth).getUTCMonth()];

			if (!dataPerMonths[`${dateYear} ${periodMonthFormatted}`]) {
				dataPerMonths[`${dateYear} ${periodMonthFormatted}`] = [];
			}

			dataPerMonths[`${dateYear} ${periodMonthFormatted}`].push(date);

			return dataPerMonths;
		}, []);

		let labelArea = 0;
		Object.keys(dataPerMonths).forEach((yearMonthKey) => {
			// let middleLength = Math.round(dataPerMonths[yearMonthKey].length / 2);

			dataPerMonths[yearMonthKey].forEach((day, idx) => {
				// for every case except we set month in the start of the days
				// if period is year we should return month for every day since it will be filtered on ticks callback as needed
				let year = yearMonthKey.split(' ')[0];
				let month = yearMonthKey.split(' ')[1];

				labelArea++;

				if (period === 'year') {
					if (idx === 0) {
						if (periodGroupBy === 'day' && dataPerMonths[yearMonthKey].length > 15 && labelArea < 359) {
							chartXData.push([ day, month, year ]);
							return;
						} else if (periodGroupBy === 'week' && (labelArea > 0 && labelArea < 54)) {
							chartXData.push([ day, month, year ]);
							return;
						} else if (periodGroupBy === 'month' && (labelArea < 12)) {
							chartXData.push([ day, month, year ]);
							return;
						}
					}

					if (periodGroupBy !== 'month') {
						chartXData.push([ day, '', '' ]);
					}
				} else if (idx === 0) {
					if (periodGroupBy === 'month') {
						chartXData.push([ '', month ]);
					} else if (dataPerMonths[yearMonthKey].length > 1) {
						chartXData.push([ day, month ]);
					}
				} else {
					chartXData.push([ day, '' ]);
				}
			});
		});

		return chartXData;
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

	// ignoreExtremlySmallValue: true when you need to find min value for the axis min e.g.
	getValueByMagnitude (value, rounding = 'round', magnitudeCorrection = 0, ignoreExtremlySmallValue = true) {
		let magnitude = Math.floor(Math.log10(value) === -Infinity ? 0 : Math.log10(value)) - magnitudeCorrection;

		if (ignoreExtremlySmallValue && value < 10) { return rounding === 'ceil' ? 10 : 0; }

		switch (rounding) {
			case 'round':
				return Math.round(value / Math.pow(10, magnitude)) * Math.pow(10, magnitude);
			case 'ceil':
				return Math.ceil(value / Math.pow(10, magnitude)) * Math.pow(10, magnitude);
			case 'floor':
				return Math.floor(value / Math.pow(10, magnitude)) * Math.pow(10, magnitude);
		}
	},

	convertBytesToUnits (bytesAmount, units = 'GB') {
		let unitsBase = null;

		switch (units) {
			case 'kB':
				unitsBase = 1e3;
				break;
			case 'MB':
				unitsBase = 1e6;
				break;
			case 'GB':
				unitsBase = 1e9;
				break;
			case 'TB':
				unitsBase = 1e12;
				break;
			case 'PB':
				unitsBase = 1e15;
				break;
			case 'EB':
				unitsBase = 1e18;
				break;
			default:
				unitsBase = 1;
		}

		return Math.round(bytesAmount / unitsBase);
	},

	findUnitFromArray (numbers) {
		let lookup = [
			{ value: 1, symbol: 'B' },
			{ value: 1e4, symbol: 'kB' },
			{ value: 1e7, symbol: 'MB' },
			{ value: 1e10, symbol: 'GB' },
			{ value: 1e13, symbol: 'TB' },
			{ value: 1e16, symbol: 'PB' },
			{ value: 1e19, symbol: 'EB' },
		];

		return numbers.map((num) => {
			return lookup.slice().reverse().find((item) => {
				return num >= item.value;
			});
		}).sort((a, b) => a.value - b.value)[0].symbol;
	},

	findUnitFromNumber (num) {
		let lookup = [
			{ value: 1e4, symbol: 'kB' },
			{ value: 1e7, symbol: 'MB' },
			{ value: 1e10, symbol: 'GB' },
			{ value: 1e13, symbol: 'TB' },
			{ value: 1e16, symbol: 'PB' },
			{ value: 1e19, symbol: 'EB' },
		];

		let unit = lookup.slice().reverse().find((item) => {
			return num >= item.value;
		});

		if (!unit) {
			return 'B';
		}

		return unit.symbol;
	},

	formatBytesWithUnit (num, unit) {
		let lookup = [
			{ value: 1, symbol: 'B' },
			{ value: 1e3, symbol: 'kB' },
			{ value: 1e6, symbol: 'MB' },
			{ value: 1e9, symbol: 'GB' },
			{ value: 1e12, symbol: 'TB' },
			{ value: 1e15, symbol: 'PB' },
			{ value: 1e18, symbol: 'EB' },
		];

		let item = lookup.find(l => l.symbol === unit) || lookup.slice().reverse().find((item) => {
			return num >= item.value;
		});

		return item ? module.exports.formatNumber(num / item.value) + ' ' + item.symbol : '0';
	},

	formatToShortNumber (num) {
		let lookup = [
			{ value: 1, symbol: '' },
			{ value: 1e3, symbol: 'K' },
			{ value: 1e6, symbol: 'M' },
			{ value: 1e9, symbol: 'B' },
			{ value: 1e12, symbol: 'T' },
			{ value: 1e15, symbol: 'P' },
			{ value: 1e18, symbol: 'E' },
		];
		let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;

		let item = lookup.slice().reverse().find((item) => {
			return num >= item.value;
		});

		return item ? (num / item.value).toFixed(1).replace(rx, '$1') + item.symbol : '0';
	},

	makeHTTPRequest (obj) {
		let { method = 'GET', rawResponse = false, body, url, headers } = obj;

		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			xhr.open(method || 'GET', method === 'GET' && body ? url + this.createQueryString(body) : url);

			if (headers) {
				Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
			}

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					resolve(rawResponse ? xhr.response : JSON.parse(xhr.response));
				} else {
					reject(xhr.statusText);
				}
			};

			xhr.onerror = () => reject(xhr.statusText);
			xhr.send(body);
		});
	},

	createQueryString (params) {
		return '?' + Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
	},

	deepExtend (out = {}, ...rest) {
		for (let i = 0; i < rest.length; i++) {
			let obj = rest[i];

			if (!obj) { continue; }

			for (let key in obj) {
				if (Object.hasOwn(obj, key)) {
					if (typeof obj[key] === 'object' && obj[key] !== null) {
						if (obj[key] instanceof Array) {
							out[key] = obj[key].slice(0);
						} else {
							out[key] = this.deepExtend(out[key], obj[key]);
						}
					} else {
						out[key] = obj[key];
					}
				}
			}
		}

		return out;
	},

	onDocumentReady (fn) {
		if (document.readyState !== 'loading') {
			fn();
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	},

	checkIfYearIsLeap (year) {
		if (isNaN(Number(year)) || String(year).length !== 4) {
			console.warn('Func isLeapYear expected a year as a String or a Number with 4 signs');

			return false;
		}

		if (year % 4 === 0) {
			if (year % 100 === 0) {
				if (year % 400 === 0) {
					return true;
				}

				return false;
			}

			return true;
		}

		return false;
	},

	getAmountOfDaysByMonth (month, year) {
		switch (month) {
			case '01':
			case '03':
			case '05':
			case '07':
			case '08':
			case '10':
			case '12':
				return MONTH_FULL_OF_DAYS;
			case '04':
			case '06':
			case '09':
			case '11':
				return MONTH_SHORT_OF_DAYS;
			case '02':
				return this.checkIfYearIsLeap(year) ? MONTH_LEAP_FEB_DAYS : MONTH_FEB_DAYS;
		}
	},

	getDateFormats (date) {
		let splittedDate = date.split('-');
		let dateYear = splittedDate[0];
		let dateMonth = splittedDate[1];
		let dateDay = splittedDate[2];
		let parsedDateDay = parseInt(splittedDate[2]);
		let dateDayName = new Date(Date.UTC(Number(dateYear), Number(dateMonth) - 1, Number(dateDay))).toLocaleDateString('en-US', { weekday: 'short' });
		let periodMonthShort = MONTHS_SHORT_NAMES_LIST[new Date(`${dateYear}-${dateMonth}`).getUTCMonth()];
		let periodMonthFull = MONTHS_FULL_NAMES_LIST[new Date(`${dateYear}-${dateMonth}`).getUTCMonth()];

		return {
			dateYear,
			dateMonth,
			dateDay,
			dateDayName,
			periodMonthShort,
			periodMonthFull,
			parsedDateDay,
		};
	},

	prepareDataForChartGroupedBy (rawData, groupBy, valueByDatePropName = '') {
		let rawDataDatesKeys = Object.keys(rawData.dates);
		let rawDataDatesData = rawData.dates;

		return rawDataDatesKeys.reduce((resData, date) => {
			let { dateYear, dateMonth, dateDay, dateDayName, periodMonthShort, periodMonthFull, parsedDateDay } = this.getDateFormats(date);
			let valueByDateConverted = valueByDatePropName ? rawDataDatesData[date][valueByDatePropName] : rawDataDatesData[date];

			switch (groupBy) {
				case 'month':
					if (!resData.preparedData[dateMonth]) {
						resData.preparedData[dateMonth] = {
							isFull: false,
							value: valueByDateConverted,
							day: dateDay,
							month: periodMonthShort,
							year: dateYear,
							periodStart: `${periodMonthFull} ${parsedDateDay}, ${dateYear}`,
							periodEnd: null,
						};
					} else {
						let lastDayNum = this.getAmountOfDaysByMonth(dateMonth, dateYear);

						resData.preparedData[dateMonth].value += valueByDateConverted;

						if (dateDay === lastDayNum) {
							resData.preparedData[dateMonth].periodEnd = `${periodMonthFull} ${parsedDateDay}, ${dateYear}`;

							if (resData.preparedData[dateMonth].day === `01`) {
								resData.preparedData[dateMonth].isFull = true;
							}
						}
					}

					return resData;

				case 'week':
					if (!resData.preparedData[resData.weekNumber]) {
						resData.preparedData[resData.weekNumber] = {
							isFull: false,
							value: valueByDateConverted,
							day: dateDay,
							month: periodMonthShort,
							year: dateYear,
							periodStart: `${periodMonthFull} ${parsedDateDay}, ${dateYear}`,
							periodEnd: null,
						};

						resData.weekDayCnt = 1;
					} else {
						resData.preparedData[resData.weekNumber].value += valueByDateConverted;
						resData.weekDayCnt++;

						if (resData.weekDayCnt === 7) {
							resData.preparedData[resData.weekNumber].isFull = true;
							resData.preparedData[resData.weekNumber].periodEnd = `${periodMonthFull} ${parsedDateDay}, ${dateYear}`;
						}
					}

					if (DAY_NAME_NUMBER_MAP[dateDayName] === 6) {
						resData.weekNumber++;
					}

					return resData;

				case 'day':
					if (!resData.preparedData.days) {
						resData.preparedData.days = [];
					}

					resData.preparedData.days.push({
						value: valueByDateConverted,
						day: dateDay,
						month: periodMonthShort,
						year: dateYear,
						periodStart: `${periodMonthFull} ${parsedDateDay}, ${dateYear}`,
						periodEnd: `${periodMonthFull} ${parsedDateDay}, ${dateYear}`,
					});

					return resData;
			}

			return resData;
		}, {
			weekNumber: 0,
			weekDayCnt: 0,
			preparedData: {},
		});
	},

	createWeekPeriodChartLabels (labels) {
		// for both Mobile and Desktop we will show Day and Month per each tick
		// no matter what resolution is
		return labels.map((label) => {
			return label.slice(0, 2);
		});
	},

	createMonthPeriodChartLabels (labels, groupBy) {
		let formattedLabels = [];

		if (groupBy === 'day') {
			formattedLabels = labels.map((label, idx) => {
				switch (true) {
					case screen.width >= 992:
						if (idx === 0 || label[0] === '01') {
							return label.slice(0, 2);
						}

						return label.slice(0, 1);

					case idx === Math.round(labels.length / 2):
					case idx === 0:
						return label.slice(0, 2);

					default:
						return [];
				}
			});
		}

		if (groupBy === 'week') {
			formattedLabels = labels;
		}

		return formattedLabels;
	},

	createYearPeriodChartLabels (labels, groupBy) {
		let formattedLabels = [ ...labels ];

		if (groupBy === 'day') {
			let tempCurrMonth = labels[0][1];
			let currAxisYear = labels[0][2];

			formattedLabels = labels.map((label, idx) => {
				switch (true) {
					case screen.width >= 992:
						if (idx === 0) {
							return label.slice(1, 3);
						} else if (label[2] !== currAxisYear && label[1] !== tempCurrMonth) {
							currAxisYear = label[2];
							tempCurrMonth = label[1];

							return label.slice(1, 3);
						} else if (label[1] !== tempCurrMonth && label[2] === currAxisYear) {
							tempCurrMonth = label[1];

							return label.slice(1, 2);
						}

						return [];

					case idx === 0 || idx === labels.length - 1:
						return label.slice(1, 3);
				}

				return [];
			});
		}

		if (groupBy === 'week') {
			let tempCurrMonth = labels[0][1];
			let lastPeriodMonth = labels[labels.length - 1][1];
			let currAxisYear = labels[0][2];

			formattedLabels = labels.map((label, idx) => {
				switch (true) {
					case screen.width >= 768:
						if (idx === 0 || idx === labels.length - 1 || label[2] !== currAxisYear) {
							currAxisYear = label[2];
							tempCurrMonth = label[1];

							return label.slice(1, 3);
						} else if (label[1] !== tempCurrMonth && label[1] !== lastPeriodMonth) {
							tempCurrMonth = label[1];

							return label.slice(1, 2);
						}

						return [];

					case idx === 0 || idx === labels.length - 1:
						return label.slice(1, 3);
				}

				return [];
			});
		}

		if (groupBy === 'month') {
			let currAxisYear = labels[0][2];

			formattedLabels = labels.map((label, idx) => {
				if (idx === 0 || idx === labels.length - 1 || label[2] !== currAxisYear) {
					currAxisYear = label[2];

					return label.slice(1, 3);
				}

				if (screen.width < 768) {
					return [];
				}

				return label.slice(1, 2);
			});
		}

		return formattedLabels;
	},

	// take preparedData for charts and then group it by day/week/month, calc magnitude, create labels for x-axis
	getPreparedDataForBarChart (rawData, groupBy, chartPeriod, showChartBandwidth, onlyFullPeriods = true) {
		let { preparedData } = this.prepareDataForChartGroupedBy(rawData, groupBy);
		let results = {
			values: [],
			labels: [],
			labelsStartEndPeriods: [],
			minRangeValue: 0,
			maxRangeValue: 0,
			valueUnits: '',
		};
		let dataToIteract = groupBy === 'day' ? preparedData.days : Object.values(preparedData);

		// collect data for chart depending on groupBy
		results = dataToIteract.reduce((res, period) => {
			if (onlyFullPeriods && period.isFull === false) { return res; }

			res.values.push(period.value);
			res.labels.push([ period.day, period.month, period.year ]);
			res.labelsStartEndPeriods.push([ period.periodStart, period.periodEnd, period.value ]);

			return res;
		}, results);

		if (showChartBandwidth) {
			let unit = module.exports.findUnitFromArray(results.values);
			results.values = results.values.map(v => module.exports.convertBytesToUnits(v, unit));
			results.valueUnits = ` ${unit}`;
		}

		// get min/max magnitude for y-axis
		results.minRangeValue = this.getValueByMagnitude(Math.min(...results.values), 'floor');
		results.maxRangeValue = this.getValueByMagnitude(Math.max(...results.values), 'ceil', 1);

		// create labels depending on chartPeriod, Screen size, groupBy
		switch (chartPeriod) {
			case 'week':
				results.labels = this.createWeekPeriodChartLabels(results.labels);
				break;
			case 'month':
				results.labels = this.createMonthPeriodChartLabels(results.labels, groupBy);
				break;
			case 'quarter':
			case 'year':
				results.labels = this.createYearPeriodChartLabels(results.labels, groupBy);
				break;
		}

		return results;
	},

	calcChartBarThicknessByResolution (chartPeriod = 'month', usageChartGroupBy = 'day') {
		let sreenWidth = screen.width;
		let schema = {
			thinnestBar: 1,
			thinBar: 2,
			regularBar: 4,
			wideBar: 10,
		};

		switch (chartPeriod) {
			case 'week':
				return schema.wideBar;

			case 'month':
				switch (usageChartGroupBy) {
					case 'day':
						if (sreenWidth >= 576) { return schema.wideBar; }

						return schema.regularBar;

					case 'week':
						return schema.wideBar;
				}

				break;

			case 'quarter':
				switch (usageChartGroupBy) {
					case 'day':
						if (sreenWidth >= 768) { return schema.regularBar; }

						return schema.thinBar;

					case 'week':
						return schema.regularBar;

					case 'month':
						return schema.wideBar;
				}

				break;

			case 'year':
				switch (usageChartGroupBy) {
					case 'day':
						return schema.thinnestBar;

					case 'week':
						if (sreenWidth >= 768) { return schema.regularBar; }

						return schema.thinBar;

					case 'month':
						return schema.wideBar;
				}

				break;

			default:
				return schema.regularBar;
		}
	},

	// prepare data for Providers Line Chart
	getPreparedProvidersDataForLineChart (rawData, groupBy, chartPeriod, showChartBandwidth, onlyFullPeriods = true) {
		let dataType = showChartBandwidth ? 'bandwidth' : 'hits';
		let valueUnits = '', unit;
		let sortedProviders = Object.values(rawData[dataType].providers).sort((a, b) => b.total - a.total);
		let topProviderData = sortedProviders[0] || {};
		let { preparedData: topProviderPrepData } = this.prepareDataForChartGroupedBy(topProviderData, groupBy, 'total');
		let labelsData = {
			labels: [],
			labelsStartEndPeriods: [],
		};
		let dataToIteract = groupBy === 'day' ? topProviderPrepData.days : Object.values(topProviderPrepData);
		let prepProvidersData = Object.keys(rawData[dataType].providers).reduce((result, providerName) => {
			result.push({
				providerName,
				...rawData[dataType].providers[providerName],
			});

			return result;
		}, []);

		// collect labels, period starts/ends data for chart
		labelsData = dataToIteract.reduce((labelsData, period) => {
			if (onlyFullPeriods && period.isFull === false) { return labelsData; }

			labelsData.labels.push([ period.day, period.month, period.year ]);
			labelsData.labelsStartEndPeriods.push([ period.periodStart, period.periodEnd, period.value ]);

			return labelsData;
		}, labelsData);

		// create labels depending on chartPeriod, Screen size, groupBy
		switch (chartPeriod) {
			case 'week':
				labelsData.labels = this.createWeekPeriodChartLabels(labelsData.labels);
				break;
			case 'month':
				labelsData.labels = this.createMonthPeriodChartLabels(labelsData.labels, groupBy);
				break;
			case 'quarter':
			case 'year':
				labelsData.labels = this.createYearPeriodChartLabels(labelsData.labels, groupBy);
				break;
		}

		let { allGroupedByValues, datasets } = prepProvidersData.reduce((res, providerData) => {
			let { preparedData } = this.prepareDataForChartGroupedBy(providerData, groupBy, 'total');
			let dataToIteract = groupBy === 'day' ? preparedData.days : Object.values(preparedData);

			let groupedByValues = dataToIteract.reduce((values, period) => {
				if (onlyFullPeriods && period.isFull === false) { return values; }

				values.push(period.value);

				return values;
			}, []);

			if (showChartBandwidth) {
				if (!unit) {
					unit = module.exports.findUnitFromArray(groupedByValues);
					valueUnits = ` ${unit}`;
				}

				groupedByValues = groupedByValues.map(v => module.exports.convertBytesToUnits(v, unit));
			}

			let lineColorsArr = [ '#F6821F', '#FF282D', '#A234D2', 'green', '#3370EB' ];
			let lineColorsMask = {
				CF: lineColorsArr[0],
				FY: lineColorsArr[1],
				GC: lineColorsArr[2],
				QT: lineColorsArr[3],
				BY: lineColorsArr[4],
			};

			let dataset = {
				label: module.exports.translateProviderName(providerData.providerName),
				data: groupedByValues,
				...module.exports.getLineColorsFromMask(providerData.providerName, lineColorsMask),
			};

			res.datasets.push(dataset);
			res.allGroupedByValues = [ ...res.allGroupedByValues, ...groupedByValues ];

			return res;
		}, { allGroupedByValues: [], datasets: [] });

		// get min/max magnitude for y-axis
		let maxRangeValue = this.getValueByMagnitude(Math.max(...allGroupedByValues), 'ceil', 1);

		return {
			...labelsData,
			maxRangeValue,
			valueUnits,
			datasets,
		};
	},

	// prepare data for LineChart
	getPreparedDataForLineChart (rawData, groupBy, chartPeriod, showChartBandwidth, numberOfDatasets = 5, onlyFullPeriods = true) {
		let dataType = showChartBandwidth ? 'bandwidth' : 'hits';
		let rawDataFiltered = rawData.sort((a, b) => b[dataType].hits - a[dataType].hits).slice(0, numberOfDatasets);
		let valueUnits = '', unit;
		// get top by stats version of package to get from it values for y-axis, and labels to x-axis
		let topVersionData = rawDataFiltered[0][dataType];
		let { preparedData: topVersionPrepData } = this.prepareDataForChartGroupedBy(topVersionData, groupBy);
		let labelsData = {
			labels: [],
			labelsStartEndPeriods: [],
		};
		let dataToIteract = groupBy === 'day' ? topVersionPrepData.days : Object.values(topVersionPrepData);

		// collect labels, period starts/ends adta for chart
		labelsData = dataToIteract.reduce((labelsData, period) => {
			if (onlyFullPeriods && period.isFull === false) { return labelsData; }

			labelsData.labels.push([ period.day, period.month, period.year ]);
			labelsData.labelsStartEndPeriods.push([ period.periodStart, period.periodEnd, period.value ]);

			return labelsData;
		}, labelsData);

		// create labels depending on chartPeriod, Screen size, groupBy
		switch (chartPeriod) {
			case 'week':
				labelsData.labels = this.createWeekPeriodChartLabels(labelsData.labels);
				break;
			case 'month':
				labelsData.labels = this.createMonthPeriodChartLabels(labelsData.labels, groupBy);
				break;
			case 'quarter':
			case 'year':
				labelsData.labels = this.createYearPeriodChartLabels(labelsData.labels, groupBy);
				break;
		}

		let { allGroupedByValues, datasets } = rawDataFiltered.reduce((res, versionData, idx) => {
			let { preparedData } = this.prepareDataForChartGroupedBy(versionData[dataType], groupBy);
			let dataToIteract = groupBy === 'day' ? preparedData.days : Object.values(preparedData);

			let groupedByValues = dataToIteract.reduce((values, period) => {
				if (onlyFullPeriods && period.isFull === false) { return values; }

				values.push(period.value);

				return values;
			}, []);

			if (showChartBandwidth) {
				if (!unit) {
					unit = module.exports.findUnitFromArray(groupedByValues);
					valueUnits = ` ${unit}`;
				}

				groupedByValues = groupedByValues.map(v => module.exports.convertBytesToUnits(v, unit));
			}

			let dataset = {
				label: `v${versionData.version}`,
				data: groupedByValues,
				...module.exports.getLineColorsFromMask(idx),
			};

			res.datasets.push(dataset);
			res.allGroupedByValues = [ ...res.allGroupedByValues, ...groupedByValues ];

			return res;
		}, { allGroupedByValues: [], datasets: [] });

		// get min/max magnitude for y-axis
		let maxRangeValue = this.getValueByMagnitude(Math.max(...allGroupedByValues), 'ceil', 1);

		return {
			...labelsData,
			maxRangeValue,
			valueUnits,
			datasets,
		};
	},

	// create barChart, lineChart improved tooltip title
	createImprovedExternalTooltipTitle (periodStart, periodEnd, groupedBy) {
		if (groupedBy === 'month') {
			let [ monthName, , year ] = periodStart.split(' ');

			return `${monthName}, ${year}`;
		}

		return periodStart === periodEnd ? `${periodStart}` : `${periodStart} - ${periodEnd}`;
	},

	getLineColorsFromMask (key, mask = null, customColorsArr = null) {
		let defaultColorsArr = [ '#5C667A', '#BC5090', '#FFA600', '#FF6361', '#69C4F7' ];
		let colorsArr = customColorsArr ? customColorsArr : defaultColorsArr;
		let lineColors = {
			borderColor: mask ? mask[key] : colorsArr[key],
			backgroundColor: mask ? mask[key] : colorsArr[key],
		};

		return lineColors;
	},

	translateProviderName (name) {
		switch (name) {
			case 'CF':
				return 'Cloudflare';
			case 'FY':
				return 'Fastly';
			case 'GC':
				return 'G-Core';
			case 'QT':
				return 'Quantil';
			case 'BY':
				return 'Bunny';
		}
	},

	translatePeriodsToSNotation (period) {
		switch (period) {
			case 'month':
				return 's-month';
			case 'quarter':
				return 's-quarter';
			case 'year':
				return 's-year';
		}
	},
};
