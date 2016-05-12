import _ from 'lodash';
import request from 'request-promise';
import render from './stats/render';
import logger from '../logger';

let appLog = logger('app');
let statsCache = JSON.stringify({
	cedexis: {
		decisions: [],
		perfmap: [],
		map: [],
		bestcdnspeed: [],
	},
	dns: {
		chart: [],
	},
	cdn: {
		total: {},
		percdn: [],
	},
});

updateData();
setInterval(updateData, 3600000);

export default function (req, res) {
	res.set('Content-Type', 'application/json');
	res.send(statsCache);
}

function updateData () {
	appLog.info('Updating stats.');

	request('http://dev.dakulov.com/jsdelivr/stats.php').then((body) => {
		appLog.debug('Got the following stats:');
		appLog.debug(body);

		var data = JSON.parse(body);
		var result = JSON.parse(statsCache); // Use previous data if something's missing.

		if (!_.isEmpty(data.cdn.percdn)) {
			result.cdn.percdn = data.cdn.percdn;
		}

		if (!_.isEmpty(data.cedexis.bestcdnspeed)) {
			// 1. Convert to arrays of [ name, hits ]
			// 2. Sort
			result.cedexis.bestcdnspeed = _(data.cedexis.bestcdnspeed).map((value) => {
				return [ value[1], value[2] ];
			}).sortBy(value => value[1]).value();
		}

		if (!_.isEmpty(data.dns.chart)) {
			// 1. Group by date.
			// 2. Convert to arrays of [ date, hits ].
			// 3. Remove today's (incomplete) stats.
			result.dns.chart = _.map(_.groupBy(data.dns.chart, (entry) => {
				let date = new Date(entry[0] * 1000);
				return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
			}), day => [ day[0][0], _.sum(day, entry => entry[1]) ]).slice(0, -1);
		}

		if (!_.isEmpty(data.cedexis.decisions)) {
			// 1. Group by date.
			// 2. Convert to arrays of [ date, MaxCDN, CloudFlare, KeyCDN, Quantil ].
			result.cedexis.decisions = _.map(_.groupBy(data.cedexis.decisions, 1), (decisions, date) => {
				return [
					Number(date),
					_.find(decisions, decision => decision[0] === 'MaxCDN')[2],
					_.find(decisions, decision => decision[0] === 'CloudFlare')[2],
					_.find(decisions, decision => decision[0] === 'KeyCDN')[2],
					_.get(_.find(decisions, decision => decision[0] === 'quantil'), 2, null),
				];
			});
		}

		if (!_.isEmpty(data.cedexis.map)) {
			// 1. Generate the charts and save them as images.
			// 2. Use base64 encoding and include the images in the stats.
			render(_.map(_.groupBy(data.cedexis.map, 0), (countryData) => {
				return _.map(countryData, entry => [ entry[1], entry[2] ]).sort((a, b) => a[0] - b[0]);
			})).then((images) => {
				_.forEach(images, (image, index) => {
					result.cedexis.map[index][2] = image.toString('base64');
				});

				statsCache = JSON.stringify(result);
				appLog.info('Chart images generated.');
			}).catch((error) => {
				appLog.err(error);
			});

			// 1. Group by country.
			// 2. Reformat country names (Congo, The Democratic Republic of the -> The Democratic Republic of the Congo).
			// 3. Sum hits per country.
			result.cedexis.map = _.map(_.groupBy(data.cedexis.map, 0), (data, country) => {
				return [ friendlyCountryName(country), _.sum(data, entry => entry[2]) ];
			});
		}

		// 1. Group by country.
		// 2. Reformat country names.
		// 3. Get median of the values.
		if (!_.isEmpty(data.cedexis.perfmap)) {
			result.cedexis.perfmap = _.map(_.groupBy(data.cedexis.perfmap, 0), (data, country) => {
				return [ friendlyCountryName(country), Math.round(median(_.map(data, entry => entry[2]))) ];
			});
		}

		result.cedexis.total = data.cedexis.total || result.cedexis.total;
		result.cdn.total.hits = data.cdn.total.hits || result.cdn.total.hits;
		result.cdn.total.traffic = data.cdn.total.traffic || result.cdn.total.traffic;
		result.dns.total = data.dns.total || result.dns.total;
		result.lastUpdate = Date.now();
		statsCache = JSON.stringify(result);

		appLog.info('Stats successfully updated.');
		appLog.debug(_.clone(result, true));
	}).catch((error) => {
		appLog.err(error);
	});
}

function friendlyCountryName (name) {
	let index = name.indexOf(',');

	return ~index
		? `${name.substring(index + 2)} ${name.substring(0, index)}`
		: name;
}

function median (values) {
	values = values.slice().sort((a, b) => a - b);

	return values.length % 2
		? values[(values.length - 1) / 2]
		: (values[values.length / 2] + values[values.length / 2 - 1]) / 2;
}
