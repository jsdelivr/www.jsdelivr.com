import mailer from 'nodemailer';
import logger from '../logger';
import emailConfig from '../../config/email';

let appLog = logger('app');
let config = Object.create(null);

config['custom-cdn'] = {
	email: 'contact@jsdelivr.com',
	subject: 'Custom CDN Hosting',
};

config['consultation-services'] = {
	email: 'dakulovgr@gmail.com',
	subject: 'jsDelivr: Consultation services',
};

export default function (req, res) {
	if (!(req.body.page in config) || !req.body.name || !req.body.email || !req.body.message || !/^[^@]+@[^@]+\.[^@]+$/.test(req.body.email)) {
		return res.sendStatus(400);
	}

	let transporter = mailer.createTransport({
		host: emailConfig.host,
		port: emailConfig.port,
		auth: {
			user: emailConfig.user,
			pass: emailConfig.pass,
		},
	});

	transporter.sendMail({
		from: req.body.email,
		to: config[req.body.page].email,
		subject: config[req.body.page].subject,
		text: `Name:\n${req.body.name}\n\nMessage:\n${req.body.message}`,
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
