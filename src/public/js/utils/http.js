const API_HOST = 'https://data.jsdelivr.com';

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

module.exports.fetchNetworkStats = () => {
	return $.getJSON(`${API_HOST}/v1/stats/network/day`).then((data) => {
		data.hits.total = Math.floor(data.hits.total * 30);
		data.megabytes.total = Math.floor(data.megabytes.total * 30);
		return data;
	});
};

module.exports.fetchPackageFiles = (type, name, version) => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}@${version}`);
};

module.exports.fetchPackageVersions = (type, name) => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}`);
};

module.exports.fetchTopPackages = () => {
	return $.getJSON(`${API_HOST}/v1/stats/packages/day`).then((data) => {
		data.forEach((pkg) => {
			pkg.hits = Math.floor(pkg.hits * 30);
		});

		return data;
	});
};
