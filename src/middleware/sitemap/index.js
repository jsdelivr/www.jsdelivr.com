const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const pathToPackages = require.resolve('all-the-package-names');
const readDirRecursive = require('recursive-readdir');
const Handlebars = require('handlebars');

const viewsPath = __dirname + '/../../views';
let siteMapTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap.xml', 'utf8'));
let siteMap0Template = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-0.xml', 'utf8'));
let siteMapIndexTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-index.xml', 'utf8'));

module.exports = async (ctx) => {
	ctx.params.page = ctx.params.page.replace(/\.xml$/, '');
	let packages = JSON.parse(await fs.readFile(pathToPackages, 'utf8'));
	let pages = (await readDirRecursive(viewsPath + '/pages', [ '_*' ])).map(p => path.relative(viewsPath + '/pages', p).replace(/\\/g, '/').slice(0, -5));
	let maxPage = Math.ceil(packages.length / 50000);
	let page = Number(ctx.params.page);

	pages.push(
		'oss-cdn/cocoa',
		'oss-cdn/ghost',
		'oss-cdn/musescore',
		'oss-cdn/pyodide'
	);

	if (ctx.params.page === 'index') {
		ctx.body = siteMapIndexTemplate({ maps: _.range(1, maxPage) });
	} else if (page > 0 && page <= maxPage) {
		ctx.body = siteMapTemplate({ packages: packages.slice((page - 1) * 50000, page * 50000) });
	} else if (page === 0) {
		ctx.body = siteMap0Template({ pages });
	} else {
		ctx.status = 404;
	}

	ctx.type = 'xml';
	ctx.maxAge = 24 * 60 * 60;
};
