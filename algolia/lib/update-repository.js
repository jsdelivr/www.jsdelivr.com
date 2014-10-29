var fs = require('fs');
var childProcess = require('child_process');

var Promise = require('bluebird');

Promise.promisifyAll(childProcess);

module.exports = function updateRepository () {
	if (fs.existsSync(__dirname + '/../jsdelivr/')) {
		console.log('Updating the local repository.');
		return childProcess.execAsync('git pull', { cwd: __dirname + '/../jsdelivr/' });
	}

	console.log('Cloning the repository. This will take a while...');
	return childProcess.execAsync('git clone https://github.com/jsdelivr/jsdelivr.git', { cwd: __dirname + '/../' });
};
