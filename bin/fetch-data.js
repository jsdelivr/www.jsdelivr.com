#!/usr/bin/env node

const got = require('got');
const zlib = require('zlib');
const parse = require('csv-parse');
const fs = require('fs');
const path = require('path');
const config = require('config');
const { pipeline } = require('node:stream/promises');

const ASN_COLUMN_NUM = 5;
const DOMAIN_COLUMN_NUM = 7;

async function fetchAndSaveAsnDomainMap (url) {
	let asnDomainMap = {};
	let hasRecords = false;

	let parser = parse({
		from_line: 2,
		skip_empty_lines: true,
	});

	let pipelinePromise = pipeline(
		got.stream(url),
		zlib.createGunzip(),
		parser,
	);

	for await (let row of parser) {
		hasRecords = true;
		let asn = row[ASN_COLUMN_NUM];
		let domain = row[DOMAIN_COLUMN_NUM];

		if (asn && domain) {
			asnDomainMap[asn] = domain;
		}
	}

	if (!hasRecords) {
		throw new Error('No data found in ipinfo-lite CSV file');
	}

	await pipelinePromise;

	let outputPath = path.resolve(__dirname, '../data/asn-domain.json');
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });

	let jsonWithTabs = JSON.stringify(asnDomainMap, null, '\t') + '\n';
	fs.writeFileSync(outputPath, jsonWithTabs, 'utf8');

	console.log(`ASN-domain map saved to: ${outputPath}`);
}

async function main () {
	let IP_INFO_TOKEN = config.get('globalping.ipInfoToken');

	if (!IP_INFO_TOKEN) {
		console.error('IP_INFO_TOKEN environment variable is required');
		return 0;
	}

	let url = `https://ipinfo.io/data/ipinfo_lite.csv.gz?token=${IP_INFO_TOKEN}`;

	try {
		await fetchAndSaveAsnDomainMap(url);
	} catch (err) {
		console.error('Failed to fetch or process data:', err);
		process.exit(1);
	}
}

main().catch(console.error);
