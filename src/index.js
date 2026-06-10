// This needs to run before any require() call.
const apm = require('elastic-apm-node');
const apmUtils = require('elastic-apm-utils');
apmUtils.apm.useConstrainedResources();
global.apmClient = apm.start({});
global.apmClient.addTransactionFilter(apmUtils.apm.transactionFilter());
require('./lib/startup');

const cluster = require('cluster');
const config = require('config');
const { onExit } = require('signal-exit');

const serverConfig = config.get('server');

function listen () {
	let server = require('./server');

	server.listen(process.env.PORT || serverConfig.port, function () {
		log.info(`Web server started at http://localhost:${this.address().port}, NODE_ENV=${process.env.NODE_ENV}.`);
	});
}

let processes = serverConfig.processes;

if (cluster.isPrimary && processes > 1) {
	for (let i = 0; i < processes; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker, code, signal) => {
		if (!worker.exitedAfterDisconnect) {
			log.error(`Worker ${worker.process.pid} exited.`, { code, signal });
			cluster.fork();
		}
	});
} else {
	listen();
}

/**
 * Always log before exit.
 */
onExit((code, signal) => {
	log[code === 0 ? 'info' : 'fatal']('Web server stopped.', { code, signal });
});

/**
 * If we exit because of an uncaught exception, log the error details as well.
 */
process.on('uncaughtException', (error) => {
	log.fatal(`Uncaught exception. Exiting.`, error, { handled: false });

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});

process.on('unhandledRejection', (error) => {
	log.fatal('Unhandled rejection. Exiting.', error, { handled: false });

	setTimeout(() => {
		process.exit(1);
	}, 10000);
});
