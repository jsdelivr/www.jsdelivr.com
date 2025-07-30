const _ = require('../_');
const API_HOST = 'https://data.jsdelivr.com';
const GITHUB_API_HOST = 'https://api.github.com';
const SNYK_API_HOST = 'https://snyk-widget.herokuapp.com';
const RAW_GH_USER_CONTENT_HOST = 'https://raw.githubusercontent.com';
const GLOBALPING_HOST = 'https://api.globalping.io';
const GLOBALPING_DASH_HOST = 'https://dash-directus.globalping.io';
const HTTP_CACHE = new Map();

const getWithCache = (url, params = {}, responseHeadersToGet = null) => {
	url += _.createQueryString(params);

	if (HTTP_CACHE.has(url)) {
		return HTTP_CACHE.get(url);
	}

	let request;

	if (responseHeadersToGet) {
		request = _.makeHTTPRequest({ url, responseHeadersToGet });
	} else {
		request = _.makeHTTPRequest({ url });
	}

	HTTP_CACHE.set(url, request);

	return request;
};

module.exports.fetchPackageReadme = (type, name, version) => {
	return _.makeHTTPRequest({ url: `/readme/${type}/${name}${version ? `/${version}` : ''}`, rawResponse: true });
};

module.exports.fetchNetworkStats = (period = 'month') => {
	return getWithCache(`${API_HOST}/v1/stats/network/content?period=${period}`);
};

module.exports.fetchPackageFiles = (type, name, version) => {
	return getWithCache(`${API_HOST}/v1/packages/${type}/${name}@${encodeURIComponent(version)}`);
};

module.exports.fetchPackageFilesFlat = (type, name, version) => {
	let flatten = (items) => {
		return items.reduce((acc, item) => {
			if (item.type === 'file') {
				acc.push({
					...item,
					name: `/${item.name}`,
				});

				return acc;
			}

			return flatten(item.files).reduce((acc, file) => {
				acc.push({
					...file,
					name: `/${item.name}${file.name}`,
				});

				return acc;
			}, acc);
		}, []);
	};

	return getWithCache(`${API_HOST}/v1/packages/${type}/${name}@${encodeURIComponent(version)}`).then((response) => {
		return {
			...response,
			files: flatten(response.files),
		};
	});
};

module.exports.fetchPackageFileStats = (type, name, version, period = 'month', by = 'hits', limit = undefined) => {
	return getWithCache(`${API_HOST}/v1/stats/packages/${type}/${name}@${encodeURIComponent(version)}/files`, { period, by, limit });
};

module.exports.fetchPackageFileStatsWithHeaders = (
	type,
	name,
	version,
	period = 'month',
	by = 'hits',
	limit = 5,
	page = 1,
) => {
	let responseHeadersToGet = [ 'x-total-count', 'x-total-pages' ];

	return getWithCache(`${API_HOST}/v1/stats/packages/${type}/${name}@${encodeURIComponent(version)}/files`, { period, by, limit, page }, responseHeadersToGet);
};

module.exports.fetchPackageSummaryStats = (type, name, period = 'month') => {
	return getWithCache(`${API_HOST}/v1/stats/packages/${type}/${name}`, { period });
};

module.exports.fetchPackageVersionsStats = (type, name, period = 'month', by = 'hits', limit = '5') => {
	return getWithCache(`${API_HOST}/v1/stats/packages/${type}/${name}/versions`, { period, by, limit });
};

module.exports.fetchPackageVersionsStatsWithHeaders = (
	type,
	name,
	period = 'month',
	by = 'hits',
	limit = 5,
	page = 1,
) => {
	let responseHeadersToGet = [ 'x-total-count', 'x-total-pages' ];

	return getWithCache(`${API_HOST}/v1/stats/packages/${type}/${name}/versions`, { period, by, limit, page }, responseHeadersToGet);
};

module.exports.fetchPackageVersions = (type, name) => {
	return getWithCache(`${API_HOST}/v1/packages/${type}/${name}`);
};

module.exports.fetchTopPackages = (period = 'month') => {
	return getWithCache(`${API_HOST}/v1/stats/packages?type=npm&period=${period}`);
};

module.exports.fetchProjectCommits = (owner, repo) => {
	return getWithCache(`${GITHUB_API_HOST}/repos/${owner}/${repo}/commits`);
};

module.exports.findProjectIssue = (owner, repo, title) => {
	return getWithCache(`${GITHUB_API_HOST}/search/issues`, { q: `${title} user:${owner} repo:${repo}` });
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
	return getWithCache(`${API_HOST}/v1/packages/${type}/${name}@${encodeURIComponent(version)}/entrypoints`);
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
	return getWithCache(`${API_HOST}/v1/stats/proxies/${name}`, { period });
};

module.exports.fetchNetworkProviderStats = (period, country = '', continent = '') => {
	let body = {
		period,
	};
	country && (body.country = country);
	continent && (body.continent = continent);
	return getWithCache(`${API_HOST}/v1/stats/network`, body);
};

module.exports.fetchNetworkProviderStatsByCountry = (period = 'month') => {
	return getWithCache(`${API_HOST}/v1/stats/network/countries`, { period });
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
	limit = 10,
) => {
	let responseHeadersToGet = [ 'x-total-count', 'x-total-pages' ];
	let url = dataType === 'platform' ? `${API_HOST}/v1/stats/platforms` : `${API_HOST}/v1/stats/browsers`;
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

	return _.makeHTTPRequest({ url: `${API_HOST}/v1/stats/packages`, body, responseHeadersToGet });
};

module.exports.fetchNetworkWideStats = () => {
	return getWithCache(`${API_HOST}/v1/stats/network`);
};

module.exports.fetchNumberOfResources = () => {
	let responseHeadersToGet = [ 'x-total-count' ];
	let body = { limit: 1 };

	return _.makeHTTPRequest({ url: `${API_HOST}/v1/stats/packages`, body, responseHeadersToGet });
};

module.exports.fetchListStatPeriods = () => {
	return getWithCache(`${API_HOST}/v1/stats/periods`);
};

module.exports.fetchGlobalpingProbes = () => {
	return _.makeHTTPRequest({ url: `${GLOBALPING_HOST}/v1/probes` });
};

module.exports.postGlobalpingMeasurement = (opts, responseHeadersToGet) => {
	let params = {
		method: 'POST',
		url: `${GLOBALPING_HOST}/v1/measurements`,
		body: opts,
		withCredentials: /(?:^|\.)globalping\.io$/.test(location.hostname),
	};

	if (responseHeadersToGet) {
		params = {
			...params,
			responseHeadersToGet,
		};
	}

	return _.makeHTTPRequest(params);
};

module.exports.getGlobalpingMeasurement = (id) => {
	return _.makeHTTPRequest({ url: `${GLOBALPING_HOST}/v1/measurements/${id}` });
};

module.exports.getBlogRss = () => {
	return _.makeHTTPRequest({ url: `/blog/rss`, rawResponse: true });
};

module.exports.getGPBlogRss = () => {
	return _.makeHTTPRequest({ url: `https://blog.globalping.io/rss/`, rawResponse: true });
};

module.exports.getCdnOssFiles = (
	name,
	by = 'hits',
	limit = 5,
	page = 1,
) => {
	let responseHeadersToGet = [ 'x-total-count', 'x-total-pages' ];

	return getWithCache(`${API_HOST}/v1/stats/proxies/${name}/files`, { page, limit, by }, responseHeadersToGet);
};

module.exports.getGlobalpingUser = () => {
	// Note: The authentication won't work out of the box on localhost because the cookie is set with SameSite=Strict
	// If you need to test the page as an authenticated user (and don't want to set up a local dash and API),
	// just set the production cookie "dash_session_token" (.globalping.io) to SameSite=None via devtools.
	return _.makeHTTPRequest({ url: `${GLOBALPING_DASH_HOST}/users/me`, withCredentials: true }).then(body => body.data).catch(() => null);
};

module.exports.getSponsorshipDetails = (userId) => {
	return _.makeHTTPRequest({ url: `${GLOBALPING_DASH_HOST}/sponsorship-details`, withCredentials: true, body: { userId } });
};

module.exports.gpLogOut = () => {
	return _.makeHTTPRequest({
		method: 'POST',
		url: `${GLOBALPING_DASH_HOST}/auth/logout`,
		body: { mode: 'session' },
		withCredentials: true,
		rawResponse: true,
	});
};

module.exports.getDomainFromASN = (asn) => {
	return _.makeHTTPRequest({ url: `/asn-to-domain/${asn}` });
};
