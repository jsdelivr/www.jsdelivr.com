const colors = require('./colors');
const providers = require('./providers');
const getProvider = require('./get-provider');

module.exports = (title) => {
	return colors[providers.indexOf(getProvider(title))];
};
