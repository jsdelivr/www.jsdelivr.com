var childProcess = require('child_process');
var crypto = require('crypto');

var _ = require('lodash');
var updater;

module.exports = function (req, res) {
	var sha256 = crypto.createHash('sha256');
	sha256.update(req.query.api || '');

	if (sha256.digest('hex') !== '98d7ff35d725ea9442ce12ecad32c8c18768fd7a697ce9e78d8ff2a137403c07') {
		res.send('Invalid API key.');
	} else {
		res.send('The index will be updated.');

		if (updater) {
			console.log('Stopping the updater.');
			updater.kill();
		}

		console.log('Starting the updater.');
		updater = childProcess.fork(__dirname + '/../algolia/index.js', { env: _.assign({ ALGOLIA_API_KEY: req.query.api }, process.env) });
	}
};
