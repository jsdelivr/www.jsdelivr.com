#!/usr/bin/env node

const got = require('got');
const gunzip = require('gunzip-maybe');
const parseCsv = require('csv-parse/lib/sync');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fetchAndSaveAsnDomainMap (url) {
	let chunks = [];
	await new Promise((resolve, reject) => {
		got.stream(url)
			.pipe(gunzip())
			.on('data', chunk => chunks.push(chunk))
			.on('end', resolve)
			.on('error', reject);
	});

	let csvText = Buffer.concat(chunks).toString();
	let records = parseCsv(csvText, {
		skip_empty_lines: true,
	});

	let asnDomainMap = {};

	for (let i = 1; i < records.length; i++) {
		let row = records[i];
		let asn = row[5];
		let domain = row[7];

		if (asn && domain) {
			asnDomainMap[asn] = domain;
		}
	}

	let outputPath = path.resolve(__dirname, '../src/assets/json/asn-domain.json');
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });

	let jsonWithTabs = JSON.stringify(asnDomainMap, null, '\t') + '\n';
	fs.writeFileSync(outputPath, jsonWithTabs, 'utf8');

	console.log(`ASN-domain map saved to: ${outputPath}`);
}

async function main () {
	let url = `https://ipinfo.io/data/ipinfo_lite.csv.gz?token=${process.env.IP_INFO_TOKEN}`;
	let csvFileName = 'ipinfo_lite.csv';

	try {
		await fetchAndSaveAsnDomainMap(url, csvFileName);
	} catch (err) {
		console.error('Failed to fetch or process data:', err);
		process.exit(1);
	}
}

main();
