const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('search', () => {
	it('works', async () => {
		await browser.navigate().to(`${BASE_URL}`);
		await browser.sleep(4000);
		await browser.findElement({ css: '.search-input' }).sendKeys('jsdelivr');
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.package-name' }).getText()).to.eventually.contain('jsdelivr');
		await expect(browser.findElement({ css: '.package-name' }).getAttribute('href')).to.eventually.contain('/package/npm/jsdelivr');
		await expect(browser.findElement({ css: '.package-buttons .button:nth-of-type(2)' }).getAttribute('href')).to.eventually.contain('https://github.com/jsdelivr/npm-jsdelivr/');
		await expect(browser.findElement({ css: '.package-buttons .button:nth-of-type(3)' }).getAttribute('href')).to.eventually.contain('https://www.npmjs.com/package/jsdelivr');
		await expect(browser.findElement({ css: '.package-buttons .button:nth-of-type(4)' }).getAttribute('href')).to.eventually.contain('https://registry.npmjs.org/jsdelivr/-/jsdelivr-0.1.2.tgz');
	});

	it('by author works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr`);
		await browser.sleep(1000);
		await browser.findElement({ css: '.package-owner' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.c-package-header:nth-of-type(1) .package-owner' }).getText()).to.eventually.equal('jsdelivr');
		await expect(browser.findElement({ css: '.c-package-header:nth-of-type(2) .package-owner' }).getText()).to.eventually.equal('jsdelivr');
		await expect(browser.findElement({ css: '.c-package-header:nth-of-type(3) .package-owner' }).getText()).to.eventually.equal('jsdelivr');
	});

	it('pagination works (click)', async () => {
		await browser.navigate().to(`${BASE_URL}/?query=jsdelivr`);
		await browser.sleep(1000);
		await browser.findElement({ css: '.search-pagination div:nth-of-type(5)' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.search-pagination div:nth-of-type(5)' }).getAttribute('class')).to.eventually.contain('active');
	});

	it('pagination works (url)', async () => {
		await browser.navigate().to(`${BASE_URL}/?query=jsdelivr&page=2`);
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.search-pagination div:nth-of-type(5)' }).getAttribute('class')).to.eventually.contain('active');
	});

	it('pagination works (prev)', async () => {
		await browser.navigate().to(`${BASE_URL}/?query=jsdelivr&page=2`);
		await browser.sleep(1000);
		await browser.findElement({ css: '.search-pagination div:nth-of-type(2)' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.search-pagination div:nth-of-type(4)' }).getAttribute('class')).to.eventually.contain('active');
	});

	it('pagination works (next)', async () => {
		await browser.navigate().to(`${BASE_URL}/?query=jsdelivr&page=1`);
		await browser.sleep(1000);
		await browser.findElement({ css: '.search-pagination div:nth-of-type(8)' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.search-pagination div:nth-of-type(5)' }).getAttribute('class')).to.eventually.contain('active');
	});
});
