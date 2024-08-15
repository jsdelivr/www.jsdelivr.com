const _ = require('lodash');
const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const readDirRecursive = require('recursive-readdir');
const Handlebars = require('handlebars');
const got = require('../../lib/got');

const serverHost = config.get('server.host');
const viewsPath = __dirname + '/../../views';

let siteMapTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap.xml', 'utf8'));
let siteMap0Template = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-0.xml', 'utf8'));
let siteMapIndexTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-index.xml', 'utf8'));
let packagesPromise = updatePackages();

module.exports = async (ctx) => {
	ctx.params.page = ctx.params.page.replace(/\.xml$/, '');
	let pages = (await readDirRecursive(viewsPath + '/pages', [ '_*', 'globalping*' ])).map(p => path.relative(viewsPath + '/pages', p).replace(/\\/g, '/').slice(0, -5));
	let packages = await packagesPromise;
	let maxPage = Math.ceil(packages.length / 50000);
	let page = Number(ctx.params.page);

	pages.push(
		'oss-cdn/cocoa',
		'oss-cdn/ghost',
		'oss-cdn/musescore',
		'oss-cdn/pyodide',
		'oss-cdn/fontsource',
		'oss-cdn/yocto',
	);

	if (ctx.params.page === 'index') {
		ctx.body = siteMapIndexTemplate({ serverHost, maps: _.range(1, maxPage + 1) });
	} else if (page > 0 && page <= maxPage) {
		ctx.body = siteMapTemplate({ packages: packages.slice((page - 1) * 50000, page * 50000) });
	} else if (page === 0) {
		ctx.body = siteMap0Template({ serverHost, pages });
	} else {
		ctx.status = 404;
	}

	ctx.type = 'xml';
	ctx.maxAge = 24 * 60 * 60;
};

function updatePackages () {
	return got('https://data.jsdelivr.com/v1/stats/packages/all?type=npm&period=month').json().then((body) => {
		setTimeout(updatePackages, 24 * 60 * 60 * 1000);
		return packagesPromise = body.map(({ name }) => ({ name }));
	}).catch(() => {
		setTimeout(updatePackages, 60 * 1000);
	});
}
