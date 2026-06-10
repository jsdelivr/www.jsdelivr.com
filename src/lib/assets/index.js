const fs = require('fs');
const childProcess = require('child_process');
let version = process.env.SOURCE_COMMIT || process.env.COMMIT_ID || require('../../../package.json').version;

if (!process.env.SOURCE_COMMIT && !process.env.COMMIT_ID) {
	try {
		version = childProcess.execSync('git log -1 "--format=%H"', { encoding: 'utf8' }).trim();
	} catch {
		try {
			version = fs.readFileSync(__dirname + '/../../../sha.txt', 'utf8').trim();
		} catch {}
	}
}

module.exports.version = version;
