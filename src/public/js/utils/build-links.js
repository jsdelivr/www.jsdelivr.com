const CSS_PATTERN = /\.css$/i;
const JS_PATTERN = /\.js$/i;
const CDN_ROOT = '//cdn.jsdelivr.net';

export default function (collection, groupLinks = true) {
	let links = { js: [], css: [], other: [] };

	collection.forEach((file) => {
		let link = `${CDN_ROOT}/${file.project}/${file.version}/${file.name}`;

		if (CSS_PATTERN.test(file.name)) {
			links.css.push(link);
		} else if (JS_PATTERN.test(file.name)) {
			links.js.push(link);
		} else {
			links.other.push(link);
		}
	});

	if (!groupLinks) {
		return links;
	}

	return {
		js: buildLink(collection, JS_PATTERN, links.js.length > 1),
		css: buildLink(collection, CSS_PATTERN, links.css.length > 1),
		other: links.other,
	};
}

function buildLink (collection, filter, merge) {
	let chunks = [];
	let filtered = collection.filter(file => filter.test(file.name));

	// There is ony one file of this type; don't merge.
	if (!merge && filtered.length) {
		return [ `${CDN_ROOT}/${filtered[0].project}/${filtered[0].version}/${filtered[0].name}` ];
	}

	groupByProject(filtered).forEach((project) => {
		if (project.files.length) {
			let link = `${project.name}@${project.version}`;

			// No need to create a list of files if there is only the main file.
			if (project.files.length !== 1 || project.files[0] !== project.mainfile) {
				link += `(${project.files.join('+')})`;
			}

			chunks.push(link);
		}
	});

	return chunks.length
		? [ `${CDN_ROOT}/g/${chunks.join(',')}` ]
		: [];
}

function groupByProject (collection) {
	let projects = {};

	collection.forEach((file) => {
		let key = file.project + file.version;

		if (!projects[key]) {
			projects[key] = {
				name: file.project,
				version: file.version,
				mainfile: file.mainfile,
				files: [ file.name ],
			};
		} else {
			projects[key].files.push(file.name);
		}
	});

	return Object.keys(projects).map(key => projects[key]);
}
