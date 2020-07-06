const providers = require('./providers');

module.exports = (title) => {
	return providers.filter(p => title.includes(p))[0] || 'Other';
};
