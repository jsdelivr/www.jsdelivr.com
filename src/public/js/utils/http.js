
const _ = require('../_');
const STAGING_API_HOST = 'https://data-jsdelivr-com-preview.onrender.com';
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
			rawResponse: true,
		}).then((response) => {
			resolve(response);
		}).catch(() => {
			_.makeHTTPRequest({
				url: `${RAW_GH_USER_CONTENT_HOST}/${packageOwner}/${packageName}/${packageGitHead}/README.markdown`,
				rawResponse: true,
			}).then((response) => {
				resolve(response);
			}).catch((err) => {
				reject(err);
			});
		});
	});
};

module.exports.fetchCdnOssStats = (type, name, period = 'month') => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/proxy/${name}/stats`, body: { type, period } });
};

module.exports.fetchNetworkProviderStats = (type, period, country = '') => {
	let body = {
		type, period,
	};
	country && (body.country = country);
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/network/providers`, body });
};

module.exports.fetchNetworkProviderStatsByCountry = (type, period) => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/network/countries`, body: { type, period } });
};

/** *
 * @param type - platform type  value:  "platforms", "browsers"
 * @param isVersionGrouped  -  version grouped switchbox value: boolean
 * @param selectedItem - selected certain platform or browser value:string
 * @param breakdown - country breakdown, browser breakdown, platform , version berakdown
 ***/
module.exports.fetchTopPlatformBrowserStats = (type, isVersionGrouped, selectedItem, breakdown) => {
	let url = type === 'platform' ? '/v1/stats/platforms' : '/v1/stats/browsers';

	if (!isVersionGrouped) {
		if (!selectedItem) {
			url += '/versions'; // initial state but <version group> switch box is disabled
		} else { 					// when a user selected one platform or browser in the list , <version group> is disabled
			url += `/${selectedItem.name}/versions/${selectedItem.version}/countries`;
		}
	} else {						// <version group> switchbox is enabled
		if (selectedItem) { 		// user selected one platform or browser
			url += `${selectedItem.name}/${breakdown}`;
		}
	}

	return _.makeHTTPRequest({ url });
};

module.exports.fetchProjectStats = (type, statsType, period) => {
	statsType = statsType === 'all' ? '' : `/${statsType}`;

	return _.makeHTTPRequest({
		url: type === 'popular' ? `${STAGING_API_HOST}/v1/stats/packages${statsType}` : `${STAGING_API_HOST}/v1/stats/packages${statsType}`,
		body: {
			period,
		},
	});
};
