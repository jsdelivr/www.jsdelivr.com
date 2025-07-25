const { pluralize } = require('../../assets/js/_');
const { fetchGlobalpingStats,
	getRangeString,
	getStatusCodes,
	getViableData,
	validateMeasurementData,
} = require('./utils/globalping');

function formatMeasurements (data, formatter) {
	return data.map(formatter).join('; ') + '.';
}

function getFailMessage (target, isComparison) {
	if (isComparison) {
		return `${target}: test failed on all probes`;
	}

	return 'Test failed on all probes';
}

function getPingDescription (data) {
	let isComparison = data.length > 1;

	return formatMeasurements(data, (meas) => {
		let viableData = getViableData(meas);

		if (!viableData.length) {
			return getFailMessage(meas.target, isComparison);
		}

		let latRange = `${getRangeString(viableData.map(obj => obj.result.stats?.avg))} ms`;
		let lossRange = `${getRangeString(viableData.map(obj => obj.result.stats?.loss))}%`;

		if (isComparison) {
			return `${meas.target}: latency ${latRange}, packet loss ${lossRange}`;
		}

		return `Latency ${latRange}, packet loss ${lossRange} (based on ${meas.results.length} ${pluralize('probe', meas.results.length)})`;
	});
}

function getTracerouteDescription (data) {
	let isComparison = data.length > 1;

	return formatMeasurements(data, (meas) => {
		let viableData = getViableData(meas);

		if (!viableData.length) {
			return getFailMessage(meas.target, isComparison);
		}

		let latRange = getRangeString(viableData.map(obj => _.mean(obj.result.hops?.at(-1).timings.map(timing => timing.rtt)))) + ' ms';
		let hopRange = getRangeString(viableData.map(obj => obj.result.hops?.length));

		if (isComparison) {
			return `${meas.target}: latency ${latRange}, hop count ${hopRange}`;
		}

		return `Latency ${latRange}, hop count ${hopRange} (based on ${meas.results.length} ${pluralize('probe', meas.results.length)})`;
	});
}

function getMtrDescription (data) {
	let isComparison = data.length > 1;

	return formatMeasurements(data, (meas) => {
		let viableData = getViableData(meas);

		if (!viableData.length) {
			return getFailMessage(meas.target, isComparison);
		}

		let latRange = `${getRangeString(viableData.map(obj => obj.result.hops?.at(-1).stats?.avg))} ms`;
		let lossRange = `${getRangeString(viableData.map(obj => obj.result.hops?.at(-1).stats?.loss))}%`;

		if (isComparison) {
			return `${meas.target}: latency ${latRange}, packet loss ${lossRange}`;
		}

		let hopRange = getRangeString(viableData.map(obj => obj.result.hops?.length));

		return `Latency ${latRange}, packet loss ${lossRange}, hop count ${hopRange} (based on ${meas.results.length} ${pluralize('probe', meas.results.length)})`;
	});
}

function getDnsDescription (data) {
	let isComparison = data.length > 1;

	return formatMeasurements(data, (meas) => {
		let viableData = getViableData(meas);

		if (!viableData.length) {
			return getFailMessage(meas.target, isComparison);
		}

		let isTrace = !!meas.measurementOptions?.trace;

		let timeString = isTrace ? 'Query time ' : 'Time ';
		let answersString = 'number of answers ';

		if (isTrace) {
			timeString += `${getRangeString(viableData.map(obj => obj.result.hops.at(-1).timings.total))} ms`;
			answersString += getRangeString(viableData.map(obj => obj.result.hops.at(-1).answers.length));
		} else {
			timeString += `${getRangeString(viableData.map(obj => obj.result.timings.total))} ms`;
			answersString += getRangeString(viableData.map(obj => obj.result.answers.length));
		}

		if (isComparison) {
			return `${meas.target}: ${timeString.toLowerCase()}, ${answersString}`;
		}

		return `${timeString}, ${answersString} (based on ${meas.results.length} ${pluralize('probe', meas.results.length)})`;
	});
}

function getHttpDescription (data) {
	let isComparison = data.length > 1;

	// construct URL
	let path = data[0].measurementOptions?.request?.path ?? '';
	let query = data[0].measurementOptions?.request?.query ?? '';
	let completePathString = '/' + path.replace(/^\//, '') + (query && '?' + query.replace(/^\?/, ''));

	let descriptionString = formatMeasurements(data, (meas) => {
		let viableData = getViableData(meas);

		if (!viableData.length) {
			return getFailMessage(meas.target, isComparison);
		}

		// get time string
		let timeRange = `${getRangeString(viableData.map(obj => obj.result.timings?.total))} ms`;

		// construct status codes
		let statusCodes = getStatusCodes(meas.results, false);
		let resCodeText = statusCodes.slice(0, isComparison ? 1 : 3).map(code => `${code.code} (${code.count})`).join(', ');

		if (statusCodes.length > 3 && !isComparison) {
			resCodeText += `... (+${statusCodes.length - 3})`;
		}

		if (isComparison) {
			return `${meas.target}: top status code: ${resCodeText}, total time ${timeRange}`;
		}

		return `response status codes: ${resCodeText}, total time ${timeRange} (based on ${meas.results.length} ${pluralize('probe', meas.results.length)})`;
	});

	return `URL: "${completePathString}", ${descriptionString}`;
}

const gpDescFunctions = {
	dns: getDnsDescription,
	http: getHttpDescription,
	mtr: getMtrDescription,
	ping: getPingDescription,
	traceroute: getTracerouteDescription,
};

function getOgDescription (data) {
	if (data.some(meas => meas.status === 'in-progress').length) {
		return 'Test in progress. Click to view more details or run another test.';
	}

	return gpDescFunctions[data[0].type](data) + ' Click to view more details or run another test.';
}

const gpTitles = {
	dns: 'DNS resolve',
	http: 'HTTP',
	mtr: 'MTR to',
	ping: 'Ping',
	traceroute: 'Traceroute to',
};

function getOgTitle (data) {
	let firstMeas = data[0];
	let locationCount = firstMeas.locations?.length;
	let locationStr = '';

	if (locationCount) {
		locationStr = 'from ';

		locationStr += firstMeas.locations?.slice(0, 3).map((location) => {
			return Object.values(location).join('+').trim();
		}).join(', ');

		if (locationCount > 3) {
			locationStr += `... (+${locationCount - 3})`;
		}
	}

	let measType = gpTitles[firstMeas.type];

	if (firstMeas.type === 'http') {
		measType += ` ${firstMeas.measurementOptions?.request?.method ?? 'HEAD'}`;
	}

	let targetString = data.map(meas => meas.target).join(', ');

	return `${measType} ${targetString} ${locationStr} - Globalping`;
}

module.exports = async (ctx) => {
	let measData = await fetchGlobalpingStats(ctx.query.measurement, ctx.app.env);

	if (!validateMeasurementData(measData)) {
		return { title: null, description: null };
	}

	if (measData.length) {
		return { title: getOgTitle(measData), description: getOgDescription(measData) };
	}
};
