import logger from '../js/logger';

let accessLog = logger('access');

export default {
	format: 'remoteAddr: :remote-addr; date: :date; method: :method; url: :url: httpVersion: :http-version; status: :status;'
		+ 'contentLength: :res[content-length]; referrer: :referrer; userAgent: :user-agent; responseTime: :response-time ms',
	options: {
		stream: {
			write (message) {
				accessLog.info(message.trim());
			}
		}
	},
};
