const has = require('../../../assets/js/utils/has');

module.exports.getCache = (key, ttl, getDefaultValue) => {
	if (!has.sessionStorage()) {
		return getDefaultValue().then((value) => {
			sessionStorage.setItem(key, JSON.stringify({ data: value, ttl: Date.now() + ttl }));
			return value;
		});
	}

	let value;

	try {
		value = JSON.parse(sessionStorage.getItem(key) || '{}');
	} catch {}

	if (value && value.ttl && value.ttl > Date.now()) {
		return Promise.resolve(value.data);
	}

	return getDefaultValue().then((value) => {
		console.log('value', value);
		sessionStorage.setItem(key, JSON.stringify({ data: value, ttl: Date.now() + ttl }));
		return value;
	});
};
