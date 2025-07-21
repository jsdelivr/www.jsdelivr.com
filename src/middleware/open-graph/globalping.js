const _ = require('lodash');
const { pluralize } = require('../../assets/js/_');
const { fetchGlobalpingStats, getRangeString, getStatusCodes } = require('./utils/globalping');

const getPingDescription = (data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result.stats?.avg));

	if (!viableData.length) {
		return null;
	}

	let latRange = `${getRangeString(viableData.map(obj => obj.result.stats?.avg))} ms`;
	let lossRange = `${getRangeString(viableData.map(obj => obj.result.stats?.loss))}%`;

	return `Latency ${latRange}, packet loss ${lossRange} (based on ${viableData.length} ${pluralize('probe', viableData.length)}).`;
};

const getTracerouteDescription = (data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && obj.result.hops?.at(-1).timings.length);

	if (!viableData.length) {
		return null;
	}

	let latRange = getRangeString(viableData.map(obj => _.mean(obj.result.hops?.at(-1).timings.map(timing => timing.rtt)))) + ' ms';
	let hopRange = getRangeString(viableData.map(obj => obj.result.hops?.length));

	return `Latency ${latRange}, hop count ${hopRange} (based on ${viableData.length} ${pluralize('probe', viableData.length)}).`;
};

const getMtrDescription = (data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result.hops?.at(-1).stats?.avg));

	if (!viableData.length) {
		return null;
	}

	let latRange = `${getRangeString(viableData.map(obj => obj.result.hops?.at(-1).stats?.avg))} ms`;
	let lossRange = `${getRangeString(viableData.map(obj => obj.result.hops?.at(-1).stats?.loss))}%`;
	let hopRange = getRangeString(viableData.map(obj => obj.result.hops?.length));

	return `Latency ${latRange}, packet loss ${lossRange}, hop count ${hopRange} (based on ${viableData.length} ${pluralize('probe', viableData.length)}).`;
};

const getDnsDescription = (data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished');

	if (!viableData.length) {
		return null;
	}

	let timeRange = `${getRangeString(viableData.map(obj => obj.result.timings.total))} ms`;
	let answersRange = getRangeString(viableData.map(obj => obj.result.answers.length));

	return `Query time ${timeRange}, number of answers ${answersRange} (based on ${viableData.length} ${pluralize('probe', viableData.length)}).`;
};

const getHttpDescription = (data) => {
	let viableData = data.results.filter(obj => obj.result.status === 'finished' && _.isFinite(obj.result?.timings?.total) && obj.result?.statusCode);

	if (!viableData.length) {
		return null;
	}

	// construct URL
	let path = data.measurementOptions?.request?.path ?? '';
	let query = data.measurementOptions?.request?.query ?? '';
	let completePathString = '/' + path.replace(/^\//, '') + (query && '?' + query.replace(/^\?/, ''));

	// construct status codes
	let statusCodes = getStatusCodes(data.results, false);
	let resCodeText = statusCodes.slice(0, 3).map(code => `${code.code} (${code.count})`).join(', ');

	if (statusCodes.length > 3) {
		resCodeText += `... (+${statusCodes.length - 3})`;
	}

	let timeRange = `${getRangeString(viableData.map(obj => obj.result.timings?.total))} ms`;

	return `URL "${completePathString}", response status codes: ${resCodeText}, total time ${timeRange} (based on ${viableData.length} ${pluralize('probe', viableData.length)}).`;
};

const gpDescFunctions = {
	dns: getDnsDescription,
	http: getHttpDescription,
	mtr: getMtrDescription,
	ping: getPingDescription,
	traceroute: getTracerouteDescription,
};

const getOgDescription = (data) => {
	if (data.status === 'in-progress') {
		return 'Test in progress. Click to view more details or run another test.';
	}

	return (gpDescFunctions[data.type](data) ?? 'Test failed on all probes.') + ' Click to view more details or run another test.';
};

const gpTitles = {
	dns: 'DNS:',
	http: 'HTTP',
	mtr: 'MTR:',
	ping: 'Ping',
	traceroute: 'Traceroute',
};

const getOgTitle = (data) => {
	let locationCount = data.locations?.length;
	let locationStr = '';

	if (locationCount) {
		locationStr = 'from ';

		locationStr += data.locations?.slice(0, 3).map((location) => {
			return Object.values(location).join('+').trim();
		}).join(', ');

		if (locationCount > 3) {
			locationStr += `... (+${locationCount - 3})`;
		}
	}

	let measType = gpTitles[data.type];

	if (data.type === 'http') {
		measType += ` (${data.measurementOptions?.request?.method ?? 'HEAD'}):`;
	}

	return `${measType} ${data.target} ${locationStr} - Globalping`;
};

module.exports = async (ctx) => {
	let data = await fetchGlobalpingStats(ctx.query.measurement, ctx.app.env);

	if (!data || !gpTitles[data.type]) {
		return { title: null, description: null };
	}

	return { title: getOgTitle(data), description: getOgDescription(data) };
};
