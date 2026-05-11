const fs = require('fs');
const childProcess = require('child_process');
let version = require('../../../package.json').version;

try {
	version = childProcess.execSync('git log -1 "--format=%H"', { encoding: 'utf8' }).trim();
} catch {
	try {
		version = fs.readFileSync(__dirname + '/../../../sha.txt', 'utf8').trim();
	} catch {}
}

module.exports.version = process.env.COMMIT_ID || version;
