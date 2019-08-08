process.env.NODE_ENV = 'test';
process.env.NO_CACHE = 'true';
process.env.LOG_LEVEL = '60';
require('../src/lib/startup');
require('../src/index');

const fs = require('fs-extra');
const filenamify = require('filenamify');
const utils = require('./utils');
const screenshotsDir = __dirname + '/screenshots';
let failureCounter = 0;

global.BASE_URL = 'http://localhost:4401';
global.browser = utils.initBrowser({ width: 1600, height: 900 });

describe('Acceptance tests', function () {
	this.timeout(20000);

	before(async () => {
		await fs.ensureDir(screenshotsDir);
		await fs.emptyDir(screenshotsDir);
	});

	afterEach(async function () {
		if (this.currentTest.state !== 'passed') {
			let data = await browser.takeScreenshot();
			await fs.writeFile(`${screenshotsDir}/${++failureCounter}-${filenamify(this.currentTest.fullTitle())}.png`, data.replace(/^data:image\/png;base64,/, ''), 'base64');
		}
	});

	after(async () => {
		await browser.close();
	});

	require('./tests/homepage');
	require('./tests/package');
	require('./tests/search');
	require('./tests/other');
});
