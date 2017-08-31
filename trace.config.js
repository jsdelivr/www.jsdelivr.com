module.exports = {
	serviceName: 'www.jsdelivr.com',
	disableInstrumentations: [
		'http',
		'https',
		'mongoose',
		'mongodb',
		'redis',
		'ioredis',
		'mysql',
		'koa',
		'express',
		'pg',
		'amqplib',
	],
};
