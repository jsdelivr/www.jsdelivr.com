import _ from 'lodash';
import request from 'request-promise';
import render from './stats/render';
import logger from '../logger';

let appLog = logger('app');
let statsCache = {};

updateData();
setInterval(updateData, 3600000);

export default function (req, res) {
	res.set('Content-Type', 'application/json');
	res.send(statsCache);
}

function updateData () {
	appLog.info('Updating stats.');

	request('http://dev.dakulov.com/jsdelivr/stats.php').then((body) => {
		var data = JSON.parse(body);

		// 1. Group by date.
		// 2. Convert to arrays of [ date, hits ].
		// 3. Remove today's (incomplete) stats.
		data.dns.chart = _.map(_.groupBy(data.dns.chart, (entry) => {
			let date = new Date(entry[0] * 1000);
			return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
		}), day => [ day[0][0], _.sum(day, entry => entry[1]) ]).slice(0, -1);

		// 1. Group by date.
		// 2. Convert to arrays of [ date, MaxCDN, CloudFlare, KeyCDN, Quantil ].
		data.cedexis.decisions = _.map(_.groupBy(data.cedexis.decisions, 1), (decisions, date) => {
			return [
				Number(date),
				_.find(decisions, decision => decision[0] === 'MaxCDN')[2],
				_.find(decisions, decision => decision[0] === 'CloudFlare')[2],
				_.find(decisions, decision => decision[0] === 'KeyCDN')[2],
				_.get(_.find(decisions, decision => decision[0] === 'quantil'), 2, null),
			];
		});

		// 1. Generate the charts and save them as images.
		// 2. Use base64 encoding and include the images in the stats.
		render(_.map(_.groupBy(data.cedexis.map, 0), (countryData) => {
			return _.map(countryData, entry => [ entry[1], entry[2] ]).sort((a, b) => a[0] - b[0]);
		})).then((images) => {
			_.forEach(images, (image, index) => {
				data.cedexis.map[index][2] = image.toString('base64');
			});

			statsCache = JSON.stringify(data);
			appLog.info('Chart images generated.');
		}).catch((error) => {
			appLog.err(error);
		});

		// 1. Group by country.
		// 2. Reformat country names (Congo, The Democratic Republic of the -> The Democratic Republic of the Congo).
		// 3. Sum hits per country.
		data.cedexis.map = _.map(_.groupBy(data.cedexis.map, 0), (data, country) => {
			return [ friendlyCountryName(country), _.sum(data, entry => entry[2]) ];
		});

		// 1. Group by country.
		// 2. Reformat country names.
		// 3. Get median of the values.
		data.cedexis.perfmap = _.map(_.groupBy(data.cedexis.perfmap, 0), (data, country) => {
			return [ friendlyCountryName(country), Math.round(median(_.map(data, entry => entry[2]))) ];
		});

		data.lastUpdate = Date.now();
		statsCache = JSON.stringify(data);

		appLog.info('Stats successfully updated.');
		appLog.debug(data);
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
	values = values.slice().sort();

	return values.length % 2
		? values[(values.length - 1) / 2]
		: (values[values.length / 2] + values[values.length / 2 - 1]) / 2;
}
