var accessLog = require('../log.js')('access');

module.exports = {
	format: 'remoteAddr: :remote-addr; date: :date; method: :method; url: :url: httpVersion: :http-version; status: :status; contentLength: :res[content-length]; referrer: :referrer; userAgent: :user-agent; responseTime: :response-time ms',
	options: {
		stream: {
			write: function (message) {
				accessLog.info(message);
			}
		}
	}
};
