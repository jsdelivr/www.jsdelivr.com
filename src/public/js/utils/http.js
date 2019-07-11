const API_HOST = 'https://data.jsdelivr.com';
const GITHUB_API_HOST = 'https://api.github.com';

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
	return $.getJSON(`${API_HOST}/v1/stats/packages/${period}`).then((data) => {
		return data.filter(pkg => pkg.type === 'npm');
	});
};

module.exports.fetchProjectCommits = (owner, repo) => {
	return $.getJSON(`${GITHUB_API_HOST}/repos/${owner}/${repo}/commits`);
};

module.exports.findProjectIssue = (owner, repo, title) => {
	return $.getJSON(`${GITHUB_API_HOST}/search/issues`, { q: `${title} user:${owner} repo:${repo}` });
};
