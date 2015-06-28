import dns from 'native-dns';
import logger from '../logger';

let appLog = logger('app');
let server = { address: 'opx1.lax.hv.prod.cedexis.com' };

dns.lookup(server.address, (error, address) => {
	if (error) {
		throw error;
	}

	server.address = address;
	appLog.info(`DNS server address: ${address}.`);
});

export default function (req, res) {
	if (!req.query.domain) {
		return res.sendStatus(400);
	}

	let request = dns.Request({
		question: dns.Question({
			name: req.query.domain,
			type: 'A',
		}),
		server: server,
	});

	request.on('timeout', () => {
		res.sendStatus(540);
	});

	request.on('message', (error, response) => {
		if (error || !response.answer.length) {
			return res.sendStatus(500);
		}

		res.send(response.answer[0].data);
	});

	request.send();
}
