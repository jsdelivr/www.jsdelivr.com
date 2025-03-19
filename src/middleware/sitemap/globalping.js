const _ = require('lodash');
const fs = require('fs-extra');
const config = require('config');
const path = require('path');
const readDirRecursive = require('recursive-readdir');
const Handlebars = require('handlebars');
const got = require('../../lib/got');
const countries = require('../../assets/json/countries.json');
const continents = require('../../assets/json/continents.json');
const usaStates = require('../../assets/json/usa-states.json');

const serverHost = config.get('globalping.server.host');
const viewsPath = __dirname + '/../../views';

let siteMapTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-gp.xml', 'utf8'));
let siteMap0Template = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-0.xml', 'utf8'));
let siteMapIndexTemplate = Handlebars.compile(fs.readFileSync(viewsPath + '/sitemap-index.xml', 'utf8'));
let probesPromise = updateProbesData();

module.exports = async (ctx) => {
	ctx.params.page = ctx.params.page.replace(/\.xml$/, '');
	let pages = (await readDirRecursive(viewsPath + '/pages/globalping', [ '_*' ])).map(p => path.relative(viewsPath + '/pages/globalping', p).replace(/\\/g, '/').slice(0, -5));
	let response = await probesPromise;
	let maxPage = Math.ceil(response.probes.length / 50000);
	let page = Number(ctx.params.page);

	if (ctx.params.page === 'index') {
		ctx.body = siteMapIndexTemplate({ serverHost, maps: _.range(1, maxPage + 2) });
	} else if (page > 1 && page <= maxPage + 1) {
		ctx.body = siteMapTemplate({ probes: response.probes.slice((page - 2) * 50000, (page - 1) * 50000) });
	} else if (page === 1) {
		ctx.body = siteMapTemplate({ users: response.users });
	} else if (page === 0) {
		ctx.body = siteMap0Template({ serverHost, pages });
	} else {
		ctx.status = 404;
	}

	ctx.type = 'xml';
	ctx.maxAge = 24 * 60 * 60;
};

function updateProbesData () {
	return got('https://api.globalping.io/v1/probes').json().then((body) => {
		setTimeout(updateProbesData, 60 * 1000);
		return createPossibleUrls(body);
	}).catch(() => {
		setTimeout(updateProbesData, 60 * 1000);
	});
}

module.exports.updateProbesData = updateProbesData;

function parseProbesResponse (data) {
	return data.reduce((res, { location }) => {
		let cityNameAsUrlPart = location.city.split(' ').join('-').toLowerCase();
		let countryNameLC = countries.find(i => i.code.toLowerCase() === location.country.toLowerCase()).name.toLowerCase();
		let countryNameAsUrlPart = countryNameLC.split(' ').join('-');
		let asnName = `as${location.asn}`;
		let networkNameAsUrlPart = location.network.replace(/\./g, '').replace(/[\W]|_/g, ' ').replace(/\s\s+|_/g, ' ').trim().split(' ').join('-').toLowerCase();
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
		if (stateNameAsUrlPart && !res.states.includes(stateNameAsUrlPart)) {
			res.states.push(stateNameAsUrlPart);
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

	return {
		probes: Object.keys(parsedProbesResponse).reduce((urlParts, ppKey) => {
			let prepared = parsedProbesResponse[ppKey].reduce((res, loc) => {
				let combined = testTypesList.map(tt => `${tt}-from-${loc}`);

				return [ ...res, ...combined ];
			}, []);

			return [ ...urlParts, ...prepared ];
		}, [ ...testTypesList ]),
		users: data.map(({ tags }) => tags).flat().filter(tag => tag.startsWith('u-')).map(tag => tag.slice(2)),
	};
}
