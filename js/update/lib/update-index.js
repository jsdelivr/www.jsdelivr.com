var util = require('util');

var Algolia = require('algolia-search');
var appLog = require('../../log.js')('app');

var client = new Algolia('0UIFPQ3RGG', process.env.ALGOLIA_API_KEY);
var jsDelivr = client.initIndex('jsDelivr');
var jsDelivrAssets = client.initIndex('jsDelivr_assets');

module.exports = function updateIndex (projects, assets) {
	jsDelivr.saveObjects(projects, function (error, content) {
		if (error) {
			appLog.err(util.format('Error (jsDelivr): %s', content.message));
		} else {
			appLog.info('jsDelivr index successfully updated.')
		}
	});

	jsDelivrAssets.saveObjects(assets, function (error, content) {
		if (error) {
			appLog.err(util.format('Error (jsDelivr_assets): %s', content.message));
		} else {
			appLog.info('jsDelivr_assets index successfully updated.')
		}
	});
};
