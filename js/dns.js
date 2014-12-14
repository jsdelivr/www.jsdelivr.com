var dns = require('native-dns');
var util = require('util');

var appLog = require('./log.js')('app');
var server = { address: 'opx1.lax.hv.prod.cedexis.com' };

dns.lookup(server.address, function (error, address) {
	if (error) {
		throw error;
	}

	server.address = address;
	appLog.info(util.format('DNS server address: %s', address));
});

module.exports = function (req, res) {
	if (!req.query.domain) {
		return res.sendStatus(400);
	}

	var request = dns.Request({
		question: dns.Question({
			name: req.query.domain,
			type: 'A'
		}),
		server: server
	});

	request.on('timeout', function () {
		res.sendStatus(540);
	});

	request.on('message', function (error, response) {
		if (error || !response.answer.length) {
			return res.sendStatus(500)
		}

		res.send(response.answer[0].data);
	});

	request.send();
};
