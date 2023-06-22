const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const readDirRecursive = require('recursive-readdir');
const Handlebars = require('handlebars');
const got = require('../../lib/got');
const countries = require('../../assets/json/countries.json');
const continents = require('../../assets/json/continents.json');
const usaStates = require('../../assets/json/usa-states.json');
const viewsPath = __dirname + '/../../views';

let siteMapTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap.xml', 'utf8'));
let siteMap0Template = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-0.xml', 'utf8'));
let siteMapIndexTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-index.xml', 'utf8'));
let probesPromise = updateProbesData();

module.exports = async (ctx) => {
	ctx.params.page = ctx.params.page.replace(/\.xml$/, '');
	let pages = (await readDirRecursive(viewsPath + '/pages', [ '_*' ])).map(p => path.relative(viewsPath + '/pages', p).replace(/\\/g, '/').slice(0, -5));
	let probes = await probesPromise;
	let maxPage = Math.ceil(probes.length / 50000);
	let page = Number(ctx.params.page);

	if (ctx.params.page === 'index') {
		ctx.body = siteMapIndexTemplate({ maps: _.range(1, maxPage + 1) });
	} else if (page > 0 && page <= maxPage) {
		ctx.body = siteMapTemplate({ probes: probes.slice((page - 1) * 50000, page * 50000) });
	} else if (page === 0) {
		ctx.body = siteMap0Template({ pages });
	} else {
		ctx.status = 404;
	}

	ctx.type = 'xml';
	ctx.maxAge = 24 * 60 * 60;
};

function updateProbesData () {
	return got('https://api.globalping.io/v1/probes').json().then((body) => {
		setTimeout(updateProbesData, 24 * 60 * 60 * 1000);

		return createPossibleUrls(body);
	}).catch(() => {
		setTimeout(updateProbesData, 60 * 1000);
	});
}

function parseProbesResponse (data) {
	return data.reduce((res, { location }) => {
		let cityNameAsUrlPart = location.city.split(' ').join('-').toLowerCase();
		let countryNameLC = countries.find(i => i.code.toLowerCase() === location.country.toLowerCase()).name.toLowerCase();
		let countryNameAsUrlPart = countryNameLC.split(' ').join('-');
		let asnName = `as${location.asn}`;
		let networkNameAsUrlPart = location.network.replace(/[^\w]|_/g, '').toLowerCase();
		let continentNameLC = continents.find(i => i.code.toLowerCase() === location.continent.toLowerCase()).name.toLowerCase();
		let continentNameAsUrlPart = continentNameLC.split(' ').join('-');
		let regionNameAsUrlPart = location.region.split(' ').join('-').toLowerCase();
		let stateCodeLC = location.state ? location.state.toLowerCase() : null;
		let stateNameLC = stateCodeLC ? usaStates.find(i => i.code.toLowerCase() === stateCodeLC).name.toLowerCase() : null;
		let stateNameAsUrlPart = stateNameLC ? stateNameLC.split(' ').join('-') : null;

		// collect uniques cities
		if (!res.cities.includes(cityNameAsUrlPart)) {
			res.cities.push(cityNameAsUrlPart);
		}

		// collect uniques ASNs
		if (!res.asns.includes(asnName)) {
			res.asns.push(asnName);
		}

		// collect uniques Networks
		if (!res.networks.includes(networkNameAsUrlPart)) {
			res.networks.push(networkNameAsUrlPart);
		}

		// collect uniques Countries
		if (!res.countries.includes(countryNameAsUrlPart)) {
			res.countries.push(countryNameAsUrlPart);
		}

		// collect uniques Continents
		if (!res.continents.includes(continentNameAsUrlPart)) {
			res.continents.push(continentNameAsUrlPart);
		}

		// collect uniques Regions
		if (!res.regions.includes(regionNameAsUrlPart)) {
			res.regions.push(regionNameAsUrlPart);
		}

		// collect uniques states (if they are present)
		if (!res.states.includes(stateNameAsUrlPart)) {
			res.cities.push(stateNameAsUrlPart);
		}

		return res;
	}, {
		cities: [],
		asns: [],
		networks: [],
		countries: [],
		continents: [],
		regions: [],
		states: [],
	});
}

function createPossibleUrls (data) {
	let testTypesList = [ 'ping', 'dns', 'traceroute', 'mtr', 'http' ];
	let parsedProbesResponse = parseProbesResponse(data);

	return parsedProbesResponse.reduce((urlParts, locsArr) => {
		let prepared = locsArr.reduce((res, loc) => {
			let combined = testTypesList.map(tt => `${tt}-from-${loc}`);

			return [ ...res, ...combined ];
		}, []);

		return [ ...urlParts, ...prepared ];
	}, [ ...testTypesList ]);
}
