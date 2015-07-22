import Logger from 'le_node';
import config from '../config/logentries';

export default function (name) {
	let log = new Logger(config[name]);

	if (process.env.NODE_ENV === 'development') {
		log.on('log', (message) => {
			console.log(message);
		});
	}

	return log;
}
