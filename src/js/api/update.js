import _ from 'lodash';
import childProcess from 'child_process';
import crypto from 'crypto';
import logger from '../logger';

let appLog = logger('app');
let updater;

export default function (req, res) {
	let sha256 = crypto.createHash('sha256').update(req.query.api || '').digest('hex');

	if (sha256 !== '98d7ff35d725ea9442ce12ecad32c8c18768fd7a697ce9e78d8ff2a137403c07') {
		res.send('Invalid API key.');
	} else {
		res.send('The index will be updated.');

		if (updater) {
			appLog.info('Stopping the updater.');
			updater.kill();
		}

		appLog.info('Starting the updater.');
		updater = childProcess.fork(__dirname + '/update/index.js', { env: _.assign({ ALGOLIA_API_KEY: req.query.api }, process.env) });
		// TODO
		// TODO: exclude projects.
	}
}
