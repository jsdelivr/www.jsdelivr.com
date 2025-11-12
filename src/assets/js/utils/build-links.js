const _ = require('../_');
const JS_PATTERN = /\.js$/i;
const CSS_PATTERN = /\.css$/i;
const ESM_PATERN = /\+esm/i;
const CDN_ROOT = 'https://cdn.jsdelivr.net';

// from https://github.com/mojombo/semver/issues/232
// modified to only allow stable versions
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

module.exports = {
	buildLinks,
	buildIntegrity,
	buildHtml,
	canBuildHtml,
};

function buildLinks (collection, html, optimize, alias, sri, outArray) {
	if (sri) {
		html = true;
		optimize = false;
		alias = false;
	}

	let links = { js: [], css: [], other: [] };

	if (outArray) {
		links.js = links.css = links.other = outArray;
	}

	let collectionCopy = collection.map((file) => {
		let copy = _.deepExtend({}, file);

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

	return outArray || links;
}

function buildCombined (collection, filter) {
	return CDN_ROOT + '/combine/' + collection.filter(file => filter.test(file.file)).map((file) => {
		return buildFileLink(file, true);
	}).join(',');
}

function buildFileLink (file, useDefault = false) {
	return `${file.type}/${file.name}@${file.version}${file.isDefault && useDefault ? '' : file.file}`;
}

function buildFileLinkHtml (isJs, link, html, hash, esmName) {
	let result = { text: link };

	if (esmName) {
		result.html = `<script type="module"> import ${esmName} from '${link}' </script>`;
	} else if (hash) {
		result.html = isJs ? `<script src="${link}" integrity="${buildIntegrity(hash)}" crossorigin="anonymous"></script>` : `<link rel="stylesheet" href="${link}" integrity="${buildIntegrity(hash)}" crossorigin="anonymous">`;
	} else if (html) {
		result.html = isJs ? `<script src="${link}"></script>` : `<link rel="stylesheet" href="${link}">`;
	} else {
		result.html = link;
	}

	return result;
}

function buildIntegrity (hash) {
	return `sha256-${hash}`;
}

function buildHtml (link, hash, esmName) {
	if (CSS_PATTERN.test(link)) {
		return buildFileLinkHtml(false, link, true, hash).html;
	} else if (JS_PATTERN.test(link)) {
		return buildFileLinkHtml(true, link, true, hash).html;
	} else if (ESM_PATERN.test(link)) {
		return buildFileLinkHtml(true, link, true, hash, esmName).html;
	}

	return buildFileLinkHtml(null, link, false).html;
}

function canBuildHtml (link) {
	return CSS_PATTERN.test(link) || JS_PATTERN.test(link) || ESM_PATERN.test(link);
}
