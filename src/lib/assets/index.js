const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
let version = require('../../../package.json').version;

try {
	version = childProcess.execSync('git log -1 "--format=%H"', { encoding: 'utf8' }).trim();
} catch (e) {
	try {
		version = fs.readFileSync(path.join(__dirname, '/../../../sha.txt'), 'utf8').trim();
	} catch (e) {}
}

module.exports.version = process.env.COMMIT_ID || version;
