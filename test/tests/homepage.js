const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('homepage', () => {
	it('loads', async () => {
		await browser.navigate().to(`${BASE_URL}`);
		await expect(browser.findElement({ css: 'body' }).getText()).to.eventually.contain('jsDelivr');
	});
});
