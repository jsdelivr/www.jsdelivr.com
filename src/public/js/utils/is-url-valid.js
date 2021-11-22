module.exports = (url) => {
	const pattern = new RegExp(
	// protocol
	'^(https?:\\/\\/)?'+
	// domain name
	'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
	// OR ip (v4) address
	'((\\d{1,3}\\.){3}\\d{1,3}))'+
	 // port and path
	'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
	 // query string
	'(\\?[;&a-z\\d%_.~+=-]*)?'+
	 // fragment locator
	'(\\#[-a-z\\d_]*)?$','i');

	return pattern.test(url);
};

// '^(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$'