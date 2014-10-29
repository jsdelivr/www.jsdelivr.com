var Algolia = require('algolia-search');

var client = new Algolia('0UIFPQ3RGG', process.env.ALGOLIA_API_KEY);
var jsDelivr = client.initIndex('jsDelivr');
var jsDelivrAssets = client.initIndex('jsDelivr_assets');

module.exports = function updateIndex (projects, assets) {
	jsDelivr.saveObjects(projects, function (error, content) {
		if (error) {
			console.error('Error (jsDelivr): %s', content.message);
		} else {
			console.log('jsDelivr index successfully updated.')
		}
	});

	jsDelivrAssets.saveObjects(assets, function (error, content) {
		if (error) {
			console.error('Error (jsDelivr_assets): %s', content.message);
		} else {
			console.log('jsDelivr_assets index successfully updated.')
		}
	});
};
