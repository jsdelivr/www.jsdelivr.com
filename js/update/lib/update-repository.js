var fs = require('fs');
var childProcess = require('child_process');

var Promise = require('bluebird');
var appLog = require('../../log.js')('app');

module.exports = function updateRepository () {
	return new Promise(function (resolve, reject) {
		var child;

		if (fs.existsSync(__dirname + '/../jsdelivr/')) {
			appLog.info('Updating the local repository.');
			child = childProcess.spawn('git', [ 'pull' ], { cwd: __dirname + '/../jsdelivr/' });
		} else {
			appLog.info('Cloning the repository. This will take a while...');
			child = childProcess.spawn('git', [ 'clone', 'https://github.com/jsdelivr/jsdelivr.git' ], { cwd: __dirname + '/../' });
		}

		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);

		child.on('close', function (code) {
			code ? reject(code) : resolve();
		});
	});
};
