import Logger from 'le_node';
import config from '../config/logentries';

export default function (name) {
	let logger = new Logger(config[name]);

	logger.on('error', (error) => {
		console.error(error);
	});

	return logger;
}
