import Logger from 'le_node';
import config from '../config/logentries';

export default function (name) {
	return new Logger(config[name]);
}
