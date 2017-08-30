const API_HOST = 'https://data.jsdelivr.com';
const _ = require('../_');

const periods = { day: 1, week: 7, month: 30, year: 365 };

module.exports.fetchCdnHeaders = () => {
	return $.ajax({
		type: 'HEAD',
		url: 'https://cdn.jsdelivr.net/heartbeat',
	}).then((data, textStatus, jqXHR) => {
		let servers = {
			'NetDNA-cache/2.2': 'maxcdn',
			'cloudflare-nginx': 'cloudflare',
		};

		return jqXHR.getResponseHeader('x-served-by') ? 'fastly' : servers[jqXHR.getResponseHeader('server')];
	});
};

module.exports.fetchNetworkStats = (period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/stats/network/week`).then((data) => {
		return _.multiplyDeep(data, periods[period] / 7);
	});
};

module.exports.fetchPackageFiles = (type, name, version) => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}@${version}`);
};

module.exports.fetchPackageDateStats = (type, name, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}/stats/date/${period}`);
};

module.exports.fetchPackageFileStats = (type, name, version, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}@${version}/stats/week`).then((data) => {
		return _.multiplyDeep(data, periods[period] / 7);
	});
};

module.exports.fetchPackageVersionStats = (type, name, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}/stats/week`).then((data) => {
		return _.multiplyDeep(data, periods[period] / 7);
	});
};

module.exports.fetchPackageVersions = (type, name) => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}`);
};

module.exports.fetchTopPackages = (period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/stats/packages/week`).then((data) => {
		return _.multiplyDeep(data.filter(pkg => pkg.type === 'npm'), periods[period] / 7);
	});
};
