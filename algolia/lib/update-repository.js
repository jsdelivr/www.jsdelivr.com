var fs = require('fs');
var childProcess = require('child_process');

var Promise = require('bluebird');

module.exports = function updateRepository () {
	return new Promise(function (resolve, reject) {
		var child;

		if (fs.existsSync(__dirname + '/../jsdelivr/')) {
			console.log('Updating the local repository.');
			child = childProcess.spawn('git', [ 'pull' ], { cwd: __dirname + '/../jsdelivr/' });
		} else {
			console.log('Cloning the repository. This will take a while...');
			child = childProcess.spawn('git', [ 'clone', 'https://github.com/jsdelivr/jsdelivr.git' ], { cwd: __dirname + '/../' });
		}

		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);

		child.on('close', function (code) {
			code ? reject(code) : resolve();
		});
	});
};
