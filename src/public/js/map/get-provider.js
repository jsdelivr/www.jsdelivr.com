const providers = require('./providers');

module.exports = (title) => {
	return providers.filter(p => title.indexOf(p) !== -1)[0] || 'Other';
};
