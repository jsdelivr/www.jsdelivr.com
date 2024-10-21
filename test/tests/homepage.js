const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('homepage', () => {
	it('loads', async () => {
		await browser.navigate().to(`${BASE_URL}`);
		await expect(browser.findElement({ css: 'body' }).getText()).to.eventually.contain('jsDelivr');
	});

	it('usage table loads', async () => {
		await browser.navigate().to(`${BASE_URL}`);
		await expect(browser.findElement({ css: '.docs-link' }).getText()).to.eventually.contain('https://cdn.jsdelivr.net/npm/package@version/file');
	});

	it('usage table npm (click)', async () => {
		await browser.navigate().to(`${BASE_URL}/?docs=gh`);
		await browser.findElement({ css: '.docs_tabs_tab:nth-of-type(1)' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.docs-link' }).getText()).to.eventually.contain('https://cdn.jsdelivr.net/npm/package@version/file');
	});

	it('usage table gh (click)', async () => {
		await browser.navigate().to(`${BASE_URL}`);
		await browser.findElement({ css: '.docs_tabs_tab:nth-of-type(3)' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.docs-link' }).getText()).to.eventually.contain('https://cdn.jsdelivr.net/gh/user/repo@version/file');
	});

	it('usage table gh (link)', async () => {
		await browser.navigate().to(`${BASE_URL}/?docs=gh`);
		await expect(browser.findElement({ css: '.docs-link' }).getText()).to.eventually.contain('https://cdn.jsdelivr.net/gh/user/repo@version/file');
	});

	it('usage table wordpress (click)', async () => {
		await browser.navigate().to(`${BASE_URL}`);
		await browser.findElement({ css: '.docs_tabs_tab:nth-of-type(4)' }).click();
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.docs-link' }).getText()).to.eventually.contain('https://cdn.jsdelivr.net/wp/plugins/project/tags/version/file');
	});

	it('usage table wordpress (link)', async () => {
		await browser.navigate().to(`${BASE_URL}/?docs=wp`);
		await expect(browser.findElement({ css: '.docs-link' }).getText()).to.eventually.contain('https://cdn.jsdelivr.net/wp/plugins/project/tags/version/file');
	});

	it('top packages table loads', async () => {
		await browser.navigate().to(`${BASE_URL}`);
		await browser.sleep(1000);
		await expect(browser.findElement({ css: '.stats-table-table :nth-child(2)' }).getText()).to.eventually.contain('npm');
	});
});
