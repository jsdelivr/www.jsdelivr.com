import mailer from 'nodemailer';
import logger from '../logger';

let appLog = logger('app');

export default function (req, res) {
	if (!req.body.name || !req.body.email || !req.body.message || !/^[^@]+@[^@]+\.[^@]+$/.test(req.body.email)) {
		return res.sendStatus(400);
	}

	let transporter = mailer.createTransport();

	transporter.sendMail({
		from: req.body.email,
		to: 'martin@kolarik.sk',
		subject: 'Custom CDN Hosting',
		text: req.body.message,
	}, function (error) {
		let email = JSON.stringify({ name: req.body.name, email: req.body.email, message: req.body.message });

		if (error) {
			appLog.err(`Failed to send email: ${email}`);
			appLog.err(error);
			return res.send(500);
		}

		appLog.info(`Sent email: ${email}`);
		return res.send(200);
	});
}
