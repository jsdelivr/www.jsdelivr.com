import logentries from 'node-logentries';
import config from '../config/logentries';

export default function (name) {
	let log = logentries.logger(config[name]);

	if (process.env.NODE_ENV === 'development') {
		log.on('log', (message) => {
			console.log(message);
		});
	}

	return log;
}
