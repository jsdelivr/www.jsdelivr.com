#!/usr/bin/env node
const fs = require('fs');
const Promise = require('bluebird');
const minDelay = require('p-min-delay');
const NodeGeocoder = require('node-geocoder');
const list = fs.readFileSync(__dirname + '/../data/map.txt', 'utf8').split('\n').filter(v => v);

const geocoder = NodeGeocoder({
	provider: 'google',
	apiKey: 'AIzaSyAG2Pke5HVsPPjuhkkbK_Xy5b665qnKUgI',
});

Promise.map(list, (line) => {
	return minDelay(geocoder.geocode(line.split('-')[1].trim()), 500);
}, { concurrency: 16 }).map((decoded, index) => {
	return { title: list[index], latitude: decoded[0].latitude, longitude: decoded[0].longitude };
}).then((locations) => {
	locations.forEach((location, index) => {
		locations.slice(index + 1).filter(l => l.latitude === location.latitude && l.longitude === location.longitude).forEach((l, i) => {
			if (i % 2) {
				l.latitude += .25;
				location.latitude -= .125;
			} else {
				l.longitude += .5;
				location.longitude -= .25;
			}
		});
	});

	return fs.writeFileSync(__dirname + '/../src/public/js/map/map.json', JSON.stringify(locations, null, '\t') + '\n');
}).catch(console.error);
