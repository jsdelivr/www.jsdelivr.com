const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const KEY = require('selenium-webdriver').Key;

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('package', () => {
	it('displays default file', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr?version=0.1.2`);
		await browser.sleep(2000);
		await expect(browser.findElement({ css: '.file-path' }).getText()).to.eventually.contain('/index.min.js');
	});

	it('displays no default file', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/font-awesome`);
		await browser.sleep(2000);
		await expect(browser.findElement({ css: '.file-message' })).to.eventually.not.equal(null);
	});

	it('opening directories works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr?version=0.1.2`);
		await browser.sleep(2000);
		await browser.findElement({ css: '.c-package-file-browser .box-content .file-link:nth-of-type(1) a' }).click();
		await expect(browser.findElement({ css: '.box-content .file-link:nth-of-type(2) .file-path' }).getText()).to.eventually.equal('demos/api_demo.js');
	});

	it('going up in directories works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr?version=0.1.2&path=demos`);
		await browser.sleep(2000);
		await browser.findElement({ css: '.c-package-file-browser .box-content .file-link:nth-of-type(1) a' }).click();
		await expect(browser.findElement({ css: '.box-content .file-link:nth-of-type(1) .file-path' }).getText()).to.eventually.equal('demos');
	});

	it('opening files works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr?version=0.1.2&path=demos`);
		await browser.sleep(2000);
		await browser.findElement({ css: '.box-content .file-link:nth-of-type(2) a' }).click();
		await expect(browser.findElement({ css: 'pre' }).getText()).to.eventually.have.lengthOf.at.least(1);
		let tabs = await browser.getAllWindowHandles();
		await browser.switchTo().window(tabs[1]);
		await browser.close();
		await browser.switchTo().window(tabs[0]);
	});

	it('changing versions works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr`);
		await browser.sleep(2000);
		await browser.findElement({ css: '.version-dropdown-selected-version' }).click();
		await browser.sleep(1000);
		await browser.findElement({ css: '.dropdown-menu-right li:last-of-type a' }).click();
		await browser.sleep(2000);
		await expect(browser.findElement({ css: '.box-content .file-link:nth-of-type(7) .file-path' }).getText()).to.eventually.equal('index.js');
	});

	it('copying url works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr?version=0.1.2`);
		await browser.sleep(2000);
		await browser.findElement({ css: '.box-content .file-link:nth-of-type(4) .c-copy-dropdown span' }).click();
		await browser.sleep(1000);
		await browser.findElement({ css: '.box-content .file-link:nth-of-type(4) .dropdown-menu a' }).click();
		await browser.sleep(1000);
		await browser.executeScript(`let ele = document.createElement('input'); ele.setAttribute('id', 'testInput'); document.body.appendChild(ele)`);
		await browser.findElement({ css: '#testInput' }).sendKeys(KEY.CONTROL, 'v');
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '#testInput' }).getAttribute('value')).to.eventually.equal('https://cdn.jsdelivr.net/npm/jsdelivr@0.1.2/.jshintrc');
		await browser.executeScript(`$('#testInput').remove()`);
	});

	it('adding files to collection works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr`);
		await browser.sleep(2500);
		await browser.findElement({ css: '.box-content .file-link:nth-of-type(7) label' }).click();
		await browser.findElement({ css: '.box-content .file-link:nth-of-type(8) label' }).click();
		await browser.sleep(1000);
		await browser.findElement({ css: '.hidden-sm > .c-collection-box .box-content-button' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.c-collection-links .collection-link:nth-of-type(3) a' }).getText()).to.eventually.equal('https://cdn.jsdelivr.net/npm/jsdelivr@0.1.2/demo.min.js');
	});

	it('removing all files from collection works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr`);
		await browser.sleep(2000);
		await browser.findElement({ css: '.box-content .file-link:nth-of-type(4) label' }).click();
		await browser.findElement({ css: '.box-content .file-link:nth-of-type(5) label' }).click();
		await browser.sleep(1000);
		await browser.executeScript(`arguments[0].click();`, await browser.findElement({ css: '.box-header .fa-trash' }));
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.hidden-sm > .c-collection-box .box-content .box-message' }).getText()).to.eventually.equal('No files selected. Select the files you want to use using the switches on the left.');
	});

	it('show all files works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/jsdelivr`);
		await browser.sleep(2000);
		await browser.findElement({ css: '.c-package-file-browser .show-more-toggle a' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.c-package-file-browser .box-content div:nth-of-type(11) .file-link:nth-of-type(1) span' }).getText()).to.eventually.contain('README.md');
	});

	it('top files switching versions works', async () => {
		await browser.navigate().to(`${BASE_URL}/package/npm/slick-carousel?version=1.8.1`);
		await browser.sleep(2000);
		let version = await browser.findElement({ css: '.c-stats-table:nth-of-type(1) tr:nth-of-type(2) a' }).getText();
		await browser.findElement({ css: '.c-stats-table:nth-of-type(1) .stats-table-table tr:nth-of-type(2) a' }).click();
		await browser.sleep(2000);
		await expect(browser.findElement({ css: '.c-stats-table .version-dropdown-selected-version a' }).getText()).to.eventually.equal(version);
	});
});
