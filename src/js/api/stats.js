import _ from 'lodash';
import countryData from 'country-data';
import request from 'request-promise';
import logger from '../logger';

let appLog = logger('app');
let statsCache = {};

updateData();
setInterval(updateData, 3600000);

export default function (req, res) {
	res.json(statsCache);
}

function updateData () {
	appLog.info('Updating stats.');

	request('http://dev.dakulov.com/jsdelivr/stats.php').then((body) => {
		var data = JSON.parse(body);

		// 1. Group by date.
		// 2. Convert to arrays of [ date, hits ].
		data.dns.chart = _.map(_.groupBy(data.dns.chart, (entry) => {
			let date = new Date(entry[0] * 1000);
			return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
		}), day => [ day[0][0], _.sum(day, entry => entry[1]) ]);

		// 1. Group by date.
		// 2. Convert to arrays of [ date, MaxCDN, CloudFlare, KeyCDN ].
		data.cedexis.decisions = _.map(_.groupBy(data.cedexis.decisions, 1), (decisions, date) => {
			return [
				Number(date),
				_.find(decisions, (decision) => decision[0] === 'MaxCDN')[2],
				_.find(decisions, (decision) => decision[0] === 'CloudFlare')[2],
				_.find(decisions, (decision) => decision[0] === 'KeyCDN')[2],
			];
		});

		// 1. Group by country.
		// 2. Reformat country names (Congo, The Democratic Republic of the -> The Democratic Republic of the Congo).
		// 3. Resolve country names to ISO codes where possible.
		// 4. Sum hits per country.
		data.cedexis.map = _.map(_.groupBy(data.cedexis.map, 0), (data, state) => {
			let code = state;

			if (~state.indexOf(',')) {
				code = state = `${state.substring(state.indexOf(',') + 2)} ${state.substring(0, state.indexOf(','))}`;
			}

			try {
				code = countryData.lookup.countries({ name: state.replace(' of', ' Of') })[0].alpha2;
			} catch (e) {}

			return [ code, _.sum(data, date => date[2]), state ];
		});

		statsCache = data;

		appLog.info('Stats successfully updated.');
	}).catch((error) => {
		appLog.err(error);
	});
}

