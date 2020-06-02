const API_HOST = 'https://data.jsdelivr.com';
const GITHUB_API_HOST = 'https://api.github.com';
const SNYK_API_HOST = 'https://snyk-widget.herokuapp.com';

module.exports.fetchNetworkStats = (period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/stats/network/${period}`);
};

module.exports.fetchPackageFiles = (type, name, version, flat = false) => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}@${encodeURIComponent(version)}${flat ? '/flat' : ''}`);
};

module.exports.fetchPackageDateStats = (type, name, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}/stats/date/${period}`);
};

module.exports.fetchPackageFileStats = (type, name, version, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}@${encodeURIComponent(version)}/stats/${period}`);
};

module.exports.fetchPackageVersionStats = (type, name, period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}/stats/${period}`);
};

module.exports.fetchPackageVersions = (type, name) => {
	return $.getJSON(`${API_HOST}/v1/package/${type}/${name}`);
};

module.exports.fetchTopPackages = (period = 'month') => {
	return $.getJSON(`${API_HOST}/v1/stats/packages/npm/${period}`);
};

module.exports.fetchProjectCommits = (owner, repo) => {
	return $.getJSON(`${GITHUB_API_HOST}/repos/${owner}/${repo}/commits`);
};

module.exports.findProjectIssue = (owner, repo, title) => {
	return $.getJSON(`${GITHUB_API_HOST}/search/issues`, { q: `${title} user:${owner} repo:${repo}` });
};

module.exports.fetchPackageVulnerabilities = (name, version) => {
	return $.ajax({
		beforeSend: (request) => { request.setRequestHeader('Authorization', '8U@$Kh6Qs#b@9qxYB!QhtvLeD=e+?Hq$_b#5%x*t'); },
		dataType: 'json',
		url: `${SNYK_API_HOST}/test/npm/lib/${name}/${version}`,
	});
};
