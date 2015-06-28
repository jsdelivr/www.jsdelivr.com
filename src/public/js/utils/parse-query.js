const ATTR_REGEXP = /\s*(?:[a-z]+)\s*:\s*(?:.(?![a-z]*\s*:))*/gi;
const QUERY_REGEXP = /^((?:(?:[^\s:]+(?![a-z]*\s*:))\s*)*)/i;

export default function (queryString) {
	let query = queryString.match(QUERY_REGEXP)[0].trim();
	let substr = queryString.substr(query.length);
	let filters = [];
	let match;

	while ((match = ATTR_REGEXP.exec(substr)) !== null) {
		let temp = match[0].split(':');
		filters.push(temp[0].trim() + ':' + temp[1].trim());
	}

	return {
		query,
		facetFilters: filters.join(','),
	};
}
