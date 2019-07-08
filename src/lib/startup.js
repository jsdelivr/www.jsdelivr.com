global._ = require('lodash');
global.Promise = require('bluebird');

const Logger = require('h-logger2');
const ElasticWriter = require('h-logger2-elastic');
const ElasticSearch = require('@elastic/elasticsearch').Client;
let esClient;

if (process.env.ELASTIC_SEARCH_URL) {
	esClient = new ElasticSearch({
		node: process.env.ELASTIC_SEARCH_URL,
	});
}

global.logger = new Logger(
	'jsdelivr-website',
	process.env.NODE_ENV === 'production' && process.env.ELASTIC_SEARCH_URL ? [
		new Logger.ConsoleWriter(process.env.LOG_LEVEL || Logger.levels.info),
		new ElasticWriter(process.env.LOG_LEVEL || Logger.levels.info, { esClient, apmClient: global.apmClient }),
	] : [
		new Logger.ConsoleWriter(process.env.LOG_LEVEL || Logger.levels.trace),
	]
);

global.log = logger.scope('global');

const fs = require('fs-extra');
Promise.promisifyAll(fs);
