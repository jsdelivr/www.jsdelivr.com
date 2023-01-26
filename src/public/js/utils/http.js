
const _ = require('../_');
const STAGING_API_HOST = 'https://data-jsdelivr-com-preview.onrender.com';
const GITHUB_API_HOST = 'https://api.github.com';
const SNYK_API_HOST = 'https://snyk-widget.herokuapp.com';
const RAW_GH_USER_CONTENT_HOST = 'https://raw.githubusercontent.com';

module.exports.fetchNetworkStats = (period = 'month') => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/network/content?period=${period}` });
};

module.exports.fetchPackageFiles = (type, name, version, flat = false) => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/packages/${type}/${name}@${encodeURIComponent(version)}${flat ? '?structure=flat' : ''}` });
};

module.exports.fetchPackageFileStats = (type, name, version, period = 'month', by = 'hits', limit = undefined) => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/packages/${type}/${name}@${encodeURIComponent(version)}/files`, body: { period, by, limit } });
};

module.exports.fetchPackageSummaryStats = (type, name, period = 'month') => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/packages/${type}/${name}`, body: { period } });
};

module.exports.fetchPackageVersionsStats = (type, name, period = 'month', by = 'hits', limit = '5') => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/packages/${type}/${name}/versions`, body: { period, by, limit } });
};

module.exports.fetchPackageVersions = (type, name) => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/packages/${type}/${name}` });
};

module.exports.fetchTopPackages = (period = 'month') => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/packages?type=npm&period=${period}` });
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
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/packages/${type}/${name}@${encodeURIComponent(version)}/entrypoints` });
};

module.exports.getGHUserContentPackageReadme = (packageOwner, packageName, packageGitHead = 'HEAD') => {
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

module.exports.fetchCdnOssStats = (name, period = 'month') => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/proxies/${name}`, body: { period } });
};

module.exports.fetchNetworkProviderStats = (period, country = '', continent = '') => {
	let body = {
		period,
	};
	country && (body.country = country);
	continent && (body.continent = continent);
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/network`, body });
};

module.exports.fetchNetworkProviderStatsByCountry = (period = 'month') => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/network/countries`, body: { period } });
};

/** *
 * @param dataType - request type value: "platforms", "browsers"
 * @param isVersionGrouped  - version grouped switchbox value: boolean
 * @param selectedItem - selected certain platform or browser value:string
 * @param breakdown - country breakdown, browser breakdown, platform, version breakdown
 * @param period -  time period for which the stats are returned (s-month, s-year)
 * @param country - country. Includes only data for this country
 * @param continent - continent. Includes only data for this country
 ***/
module.exports.fetchTopPlatformBrowserStats = (
	dataType,
	isVersionGrouped,
	period,
	selectedItem,
	breakdown,
	country,
	continent,
	page = 1,
	limit = 10
) => {
	let responseHeadersToGet = [ 'x-total-count', 'x-total-pages' ];
	let url = dataType === 'platform' ? `${STAGING_API_HOST}/v1/stats/platforms` : `${STAGING_API_HOST}/v1/stats/browsers`;
	let body = {
		period: _.translatePeriodsToSNotation(period),
		page,
		limit,
	};

	if (country) {
		body.country = country;
	}

	if (continent) {
		body.continent = continent;
	}

	if (selectedItem) {
		if (selectedItem.version) {
			url += `/${selectedItem.name.toLowerCase()}/versions/${selectedItem.version}/countries`;
		} else {
			url += `/${selectedItem.name.toLowerCase()}/${breakdown}`;
		}
	} else if (!isVersionGrouped) {
		url += '/versions';
	}

	return _.makeHTTPRequest({ url, body, responseHeadersToGet });
};

module.exports.fetchProjectStats = (type, period, sortBy = 'hits', page = 1, limit = 10) => {
	let responseHeadersToGet = [ 'x-total-count', 'x-total-pages' ];
	let body = {
		period,
		by: sortBy,
		page,
		limit,
	};

	if (type !== 'all') {
		body.type = type;
	}

	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/packages`, body, responseHeadersToGet });
};

module.exports.fetchNetworkWideStats = () => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/network` });
};

module.exports.fetchNumberOfResources = () => {
	let responseHeadersToGet = [ 'x-total-count' ];
	let body = { limit: 1 };

	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/packages`, body, responseHeadersToGet });
};


module.exports.fetchListStatPeriods = () => {
	return _.makeHTTPRequest({ url: `${STAGING_API_HOST}/v1/stats/periods` });
};
