
const _ = require('../_');
const API_HOST = 'https://data.jsdelivr.com';
const GITHUB_API_HOST = 'https://api.github.com';
const SNYK_API_HOST = 'https://snyk-widget.herokuapp.com';
const RAW_GH_USER_CONTENT_HOST = 'https://raw.githubusercontent.com';

module.exports.fetchNetworkStats = (period = 'month') => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/stats/network/${period}` });
};

module.exports.fetchPackageFiles = (type, name, version, flat = false) => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/package/${type}/${name}@${encodeURIComponent(version)}${flat ? '/flat' : ''}` });
};

module.exports.fetchPackageDateStats = (type, name, period = 'month') => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/package/${type}/${name}/stats/date/${period}` });
};

module.exports.fetchPackageFileStats = (type, name, version, period = 'month') => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/package/${type}/${name}@${encodeURIComponent(version)}/stats/${period}` });
};

module.exports.fetchPackageVersionStats = (type, name, period = 'month') => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/package/${type}/${name}/stats/${period}` });
};

module.exports.fetchPackageVersions = (type, name) => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/package/${type}/${name}` });
};

module.exports.fetchTopPackages = (period = 'month') => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/stats/packages/npm/${period}` });
};

module.exports.fetchProjectCommits = (owner, repo) => {
	return _.makeHTTPRequest({ url: `${GITHUB_API_HOST}/repos/${owner}/${repo}/commits` });
};

module.exports.findProjectIssue = (owner, repo, title) => {
	return _.makeHTTPRequest({ url: `${GITHUB_API_HOST}/search/issues`, body: { q: `${title} user:${owner} repo:${repo}` } });
};

module.exports.fetchPackageVulnerabilities = (name, version) => {
	return _.makeHTTPRequest({
		url: `${SNYK_API_HOST}/test/npm/lib/${name}/${version}`,
		headers: {
			Authorization: '8U@$Kh6Qs#b@9qxYB!QhtvLeD=e+?Hq$_b#5%x*t',
		},
	});
};

module.exports.fetchPackageEntrypoints = (type, name, version) => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/package/${type}/${name}@${encodeURIComponent(version)}/entrypoints` });
};

module.exports.fetchPackageBandwidthStats = (type, name, period = 'month') => {
	return _.makeHTTPRequest({ url: `${API_HOST}/v1/package/${type}/${name}/stats/bandwidth/date/${period}` });
};

module.exports.getGHUserContentPackageReadme = (packageOwner, packageName, packageGitHead) => {
	return new Promise((resolve, reject) => {
		_.makeHTTPRequest({
			url: `${RAW_GH_USER_CONTENT_HOST}/${packageOwner}/${packageName}/${packageGitHead}/README.md`,
		}, true).then((response) => {
			resolve(response);
		}).catch(() => {
			_.makeHTTPRequest({
				url: `${RAW_GH_USER_CONTENT_HOST}/${packageOwner}/${packageName}/${packageGitHead}/README.markdown`,
			}, true).then((response) => {
				resolve(response);
			}).catch((err) => {
				reject(err);
			});
		});
	});
};
