const getProvider = require('./get-provider');

module.exports = (title) => {
	return `/img/features/map-${getProvider(title).toLowerCase()}.svg`;
};
