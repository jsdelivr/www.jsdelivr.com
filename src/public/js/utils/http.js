const API_HOST = 'https://data.jsdelivr.com';

module.exports.fetchNetworkStats = (period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/stats/network/${period}`);
};

module.exports.fetchPackageFiles = (type, name, version) => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}@${version}`);
};

module.exports.fetchPackageDateStats = (type, name, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}/stats/date/${period}`);
};

module.exports.fetchPackageFileStats = (type, name, version, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}@${version}/stats/${period}`);
};

module.exports.fetchPackageVersionStats = (type, name, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}/stats/${period}`);
};

module.exports.fetchPackageVersions = (type, name) => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}`);
};

module.exports.fetchTopPackages = (period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/stats/packages/${period}`).then((data) => {
		return data.filter(pkg => pkg.type === 'npm');
	});
};
