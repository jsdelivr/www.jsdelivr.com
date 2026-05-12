const webdriver = require('selenium-webdriver');
const Chrome = require('selenium-webdriver/chrome');
const { until } = webdriver;

const DEFAULT_WAIT_TIMEOUT = 10000;

module.exports.initBrowser = (size) => {
	return new webdriver.Builder()
		.forBrowser('chrome')
		.setChromeService(new Chrome.ServiceBuilder(require('chromedriver').path))
		.setChromeOptions(new Chrome.Options().setChromeBinaryPath(require('chromium-binary').path).windowSize(size).addArguments(...process.env.CI ? [ '--headless' ] : []))
		.build();
};

module.exports.waitForElement = async (browser, locator, timeout = DEFAULT_WAIT_TIMEOUT) => {
	let element = await browser.wait(until.elementLocated(locator), timeout);
	await browser.wait(until.elementIsVisible(element), timeout);

	return element;
};

module.exports.waitForText = async (browser, locator, expectedText, timeout = DEFAULT_WAIT_TIMEOUT) => {
	await browser.wait(async () => {
		let elements = await browser.findElements(locator);

		if (!elements.length) {
			return false;
		}

		let text = await elements[0].getText();
		return text.includes(expectedText);
	}, timeout);

	return browser.findElement(locator);
};

module.exports.waitForAttribute = async (browser, locator, attribute, expectedValue, timeout = DEFAULT_WAIT_TIMEOUT) => {
	await browser.wait(async () => {
		let elements = await browser.findElements(locator);

		if (!elements.length) {
			return false;
		}

		let value = await elements[0].getAttribute(attribute);
		return value === expectedValue;
	}, timeout);

	return browser.findElement(locator);
};
