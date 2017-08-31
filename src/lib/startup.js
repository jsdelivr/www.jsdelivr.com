global._ = require('lodash');
global.Promise = require('bluebird');
global.logger = require('./logger');

const fs = require('fs-extra');

Promise.promisifyAll(fs);
