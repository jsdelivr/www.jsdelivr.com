const webdriver = require('selenium-webdriver');
const Chrome = require('selenium-webdriver/chrome');

module.exports.initBrowser = (size) => {
	return new webdriver.Builder()
		.forBrowser('chrome')
		.setChromeService(new Chrome.ServiceBuilder(require('chromedriver').path))
		.setChromeOptions(new Chrome.Options().setChromeBinaryPath(require('chromium-binary/utils').getOsChromiumBinPath()).windowSize(size))
		.build();
};
