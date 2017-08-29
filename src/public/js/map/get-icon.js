const getProvider = require('./get-provider');

module.exports = (title) => {
	return `/img/map-${getProvider(title).toLowerCase()}.png`;
};
