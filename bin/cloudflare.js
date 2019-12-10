#!/usr/bin/env node
const fetch = require('node-fetch-retry');
const parseCsv = require('csv-parse/lib/sync');

const result = [];

fetch('https://www.cloudflare.com/data/current-pops.csv')
	.then((res) => { return res.text(); })
	.then((text) => {
		return parseCsv(text, {
			columns: true,
			skip_empty_lines: true,
		});
	})
	.then((data) => {
		data.forEach((dc) => {
			if (dc.region !== 'CHINA') {
				result.push(`Cloudflare - ${dc.city.split(', ')[0]}`);
			}
		});

		return result.sort();
	})
	.then((result) => {
		result.forEach((i) => {
			console.log(i);
		});
	})
	.catch(() => {});
