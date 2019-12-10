#!/usr/bin/env node
const fetch = require('node-fetch-retry');
const parseCsv = require('csv-parse/lib/sync');

fetch('https://www.cloudflare.com/data/current-pops.csv')
    .then(res => res.text())
    .then(text => {
        return parseCsv(text, {
            columns: true,
            skip_empty_lines: true
        });
    })
    .then(data => {
        const result = [];

        data.forEach((dc) => {
            if (dc.region !== 'CHINA') {
                result.push(`Cloudflare - ${dc.city.split(', ')[0]}`)
            }
        });

        return result.sort();
    })
    .then(result => {
        result.forEach((i) => {
            console.log(i);
        })
    })