module.exports = (title) => {
	if (title.indexOf('Cloudflare') !== -1) {
		return '/img/map-cloudflare.png';
	} else if (title.indexOf('StackPath') !== -1) {
		return '/img/map-stackpath.png';
	} else if (title.indexOf('Key') !== -1) {
		return '/img/map-fastly.png';
	} else if (title.indexOf('QUANTIL') !== -1) {
		return '/img/map-quantil.png';
	} else {
		return '/img/map-other.png';
	}
};
