module.exports = {
	active: process.env.NODE_ENV === 'production',
	serviceName: 'jsdelivr-website',
	serviceVersion: process.env.RENDER_GIT_COMMIT || require('./package.json').version,
	logLevel: 'fatal',
	centralConfig: false,
	captureExceptions: false,
	captureSpanStackTraces: false,
	captureErrorLogStackTraces: 'always',
	ignoreUrls: [ '/favicon.ico', '/heartbeat', '/amp_preconnect_polyfill_404_or_other_error_expected._Do_not_worry_about_it' ],
	errorOnAbortedRequests: true,
	abortedErrorThreshold: 30,
	transactionSampleRate: .1,
};
