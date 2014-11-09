var logentries = require('node-logentries');
var config = require('./config/logentries.js');

module.exports = function (name) {
	var log = logentries.logger(config[name]);

	log.on('error', function (error) {
		console.error('Log error: %s', error);
	});

	if (process.env.NODE_ENV === 'development') {
		log.on('log', function (message) {
			console.log(message);
		});
	}

	return log;
};
