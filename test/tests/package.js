const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const KEY = require('selenium-webdriver').Key;
const utils = require('../utils');

const expect = chai.expect;
chai.use(chaiAsPromised);

async function waitForElement (locator) {
	return utils.waitForElement(browser, locator);
}

async function openFilesTab (url, locator = { css: '.c-package-file-browser .files-list .file-item' }) {
	await browser.navigate().to(url);
	await (await waitForElement({ id: 'tabRouteFiles' })).click();
	await waitForElement(locator);
}

describe('package', () => {
	it('displays default file', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/fontfamous?version=2.1.1`, { css: '.file-default .file-path' });
		await expect(browser.findElement({ css: '.file-path' }).getText()).to.eventually.contain('font-famous-jsdelivr.min.css');
	});

	it('opening directories works', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/fontfamous?version=2.1.1`);
		await (await waitForElement({ css: '.c-package-file-browser .box-content-wrapper .files-list .file-item:nth-child(2) button' })).click();
		await (await waitForElement({ css: '.c-package-file-browser .box-content-wrapper .files-list .file-item:nth-child(3) button' })).click();
		await utils.waitForText(browser, { css: '.box-content-wrapper .files-list .file-item:nth-child(3) a .file-path' }, 'dist/font/font-famous.eot');
	});

	it('going up in directories works', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/fontfamous?version=2.1.1&path=dist`, { css: '.c-package-file-browser .box-content-wrapper .files-list .files-list-back button' });
		await (await waitForElement({ css: '.c-package-file-browser .box-content-wrapper .files-list .files-list-back button' })).click();
		await utils.waitForText(browser, { css: '.box-content-wrapper .files-list .file-item:nth-child(2) > button .file-path' }, 'dist');
	});

	it('opening files works', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/fontfamous?version=2.1.1&path=dist/css/`);
		await (await waitForElement({ css: '.box-content-wrapper .files-list .file-item:nth-child(3) > a' })).click();
		await browser.wait(async () => (await browser.getAllWindowHandles()).length === 2, 10000);
		let tabs = await browser.getAllWindowHandles();
		await browser.switchTo().window(tabs[1]);
		await waitForElement({ css: 'pre' });
		await expect(browser.findElement({ css: 'pre' }).getText()).to.eventually.have.lengthOf.at.least(1);
		await browser.close();
		await browser.switchTo().window(tabs[0]);
	});

	it('changing versions works', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/fontfamous`);
		await (await waitForElement({ css: '.version-dropdown_selected' })).click();
		await (await waitForElement({ css: '.version-dropdown_wrapper_list li:last-of-type a' })).click();
		await (await waitForElement({ css: '.c-package-file-browser .box-content-wrapper .files-list .file-item:nth-child(2) button' })).click();
		await utils.waitForText(browser, { css: '.box-content-wrapper .files-list .file-item:nth-child(3) > button .file-path' }, 'dist/fonts');
	});

	it('copying url works', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/fontfamous?version=2.1.1`);
		await (await waitForElement({ css: '.box-content-wrapper .file-item:nth-child(3) .c-copy-dropdown [data-toggle="dropdown"]' })).click();
		await (await waitForElement({ css: '.box-content-wrapper .file-item:nth-child(3) .dropdown-menu button' })).click();
		await browser.executeScript(`let ele = document.createElement('input'); ele.setAttribute('id', 'testInput'); document.body.appendChild(ele)`);
		await browser.findElement({ css: '#testInput' }).sendKeys(KEY.CONTROL, 'v');
		await utils.waitForAttribute(browser, { css: '#testInput' }, 'value', 'https://cdn.jsdelivr.net/npm/fontfamous@2.1.1/LICENSE');
		await browser.executeScript(`let ele = document.querySelector('#testInput'); ele.parentNode.removeChild(ele)`);
	});

	it('adding files to collection works', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/fontfamous?version=2.1.1`);
		await (await waitForElement({ css: '.box-content-wrapper .file-item:nth-of-type(3) label' })).click();
		await (await waitForElement({ css: '.box-content-wrapper .file-item:nth-of-type(4) label' })).click();
		await (await waitForElement({ css: '.c-collection-box .config-btn' })).click();
		await utils.waitForText(browser, { css: '.c-collection-links .collection-link:nth-of-type(2) a' }, 'https://cdn.jsdelivr.net/npm/fontfamous@2.1.1/LICENSE');
		await utils.waitForText(browser, { css: '.c-collection-links .collection-link:nth-of-type(3) a' }, 'https://cdn.jsdelivr.net/npm/fontfamous@2.1.1/package.json');
	});

	it('removing all files from collection works', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/fontfamous?version=2.1.1`);
		await (await waitForElement({ css: '.box-content-wrapper .file-item:nth-of-type(5) label' })).click();
		await browser.executeScript(`arguments[0].click();`, await waitForElement({ css: '.collection-header .remove-text' }));
		await utils.waitForText(browser, { css: '.c-collection-box .collection-list .box-message' }, 'No files selected. Select the files you want to use using the switches on the left.');
	});

	// use jsdelivr library because fontfamous has not enough files to have a Show more button
	it('show all files works', async () => {
		await openFilesTab(`${BASE_URL}/package/npm/jsdelivr?version=0.1.2`, { css: '.c-package-file-browser .show-more-toggle button' });
		await (await waitForElement({ css: '.c-package-file-browser .show-more-toggle button' })).click();
		await utils.waitForText(browser, { css: '.c-package-file-browser .files-list > div:nth-child(12) .file-item .file-path' }, 'README.md');
	});

	it('top files switching versions works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/slick-carousel?version=1.8.1`);
		await (await waitForElement({ id: 'tabRouteStats' })).click();
		let versionLink = await waitForElement({ css: '.c-top-stats-table:nth-child(1) .table-row:nth-child(2) a' });
		let version = await versionLink.getText();
		await versionLink.click();
		await utils.waitForText(browser, { css: '.c-top-stats-table:nth-child(2) .version-dropdown_selected a' }, version);
	});
});
