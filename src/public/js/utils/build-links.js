const _ = require('../_');
const JS_PATTERN = /\.js$/i;
const CSS_PATTERN = /\.css$/i;
const CDN_ROOT = 'https://cdn.jsdelivr.net';

// from https://github.com/mojombo/semver/issues/232
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/;

module.exports = (collection, html, optimize, alias, sri) => {
	if (sri) {
		html = true;
		optimize = false;
		alias = false;
	}

	let links = { js: [], css: [], other: [] };
	let collectionCopy = collection.map((file) => {
		let copy = $.extend(true, {}, file);

		if (optimize && copy.file === _.getNonMinifiedName(copy.file)) {
			copy.file = _.getMinifiedName(file.file);
		}

		// Aliasing only works with valid semver versions.
		if (alias && SEMVER_PATTERN.test(copy.version)) {
			let parsed = SEMVER_PATTERN.exec(copy.version);

			if (Number(parsed[1]) > 0) {
				copy.version = parsed[1];
			}
		}

		return copy;
	});

	collectionCopy.forEach((file) => {
		let link = CDN_ROOT + '/' + buildFileLink(file);

		if (JS_PATTERN.test(file.file)) {
			links.js.push(buildFileLinkHtml(true, link, html, sri && file.hash));
		} else if (CSS_PATTERN.test(file.file)) {
			links.css.push(buildFileLinkHtml(false, link, html, sri && file.hash));
		} else {
			links.other.push({ html: link, text: link });
		}
	});

	if (links.js.length > 1) {
		links.js.unshift(buildFileLinkHtml(true, buildCombined(collectionCopy, JS_PATTERN), html));
	}

	if (links.css.length > 1) {
		links.css.unshift(buildFileLinkHtml(false, buildCombined(collectionCopy, CSS_PATTERN), html));
	}

	return links;
};

function buildCombined (collection, filter) {
	return CDN_ROOT + '/combine/' + collection.filter(file => filter.test(file.file)).map((file) => {
		return buildFileLink(file, true);
	}).join(',');
}

function buildFileLink (file, useDefault = false) {
	return `${file.type}/${file.name}@${file.version}${file.isDefault && useDefault ? '' : file.file}`;
}

function buildFileLinkHtml (isJs, link, html, hash) {
	let result = { text: link };

	if (hash) {
		result.html = isJs ? `<script src="${link}" integrity="sha256-${hash}" crossorigin="anonymous"></script>` : `<link rel="stylesheet" href="${link}" integrity="sha256-${hash}" crossorigin="anonymous">`;
	} else if (html) {
		result.html = isJs ? `<script src="${link}"></script>` : `<link rel="stylesheet" href="${link}">`;
	} else {
		result.html = link;
	}

	return result;
}
