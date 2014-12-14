module.exports = function (collection, group) {
	var isCss = /\.css$/i;
	var isJs = /\.js$/i;
	var css = [];
	var js = [];
	var other = [];
	var cssCount = 0;
	var jsCount = 0;

	// Count CSS and JS files and process other files.
	for (var i = collection.length - 1; i >= 0; i--) {
		for (var j = collection[i].files.length - 1; j >= 0; j--) {
			if (isCss.test(collection[i].files[j])) {
				cssCount++;
				css.unshift(collection[i].name + '/' + collection[i].version + '/' + collection[i].files[j]);
			} else if (isJs.test(collection[i].files[j])) {
				jsCount++;
				js.unshift(collection[i].name + '/' + collection[i].version + '/' + collection[i].files[j]);
			} else {
				// No further processing needed.
				other.unshift(collection[i].name + '/' + collection[i].version + '/' + collection[i].files[j]);
			}
		}
	}

	// No grouping...
	if (!group) {
		return {
			css: css,
			js: js,
			other: other
		};
	}

	return {
		css: buildLink(collection, isCss, cssCount > 1),
		js: buildLink(collection, isJs, jsCount > 1),
		other: other
	};
};

function buildLink (projects, filter, merge) {
	var chunks = [];

	// each project
	for (var i = 0, c = projects.length; i < c; i++) {
		var projectFiles = [];

		// each file
		for (var j = 0, d = projects[i].files.length; j < d; j++) {
			if (filter.test(projects[i].files[j])) {
				// There is ony one file of this type.
				if (!merge) {
					return [ projects[i].name + '/' + projects[i].version + '/' + projects[i].files[j] ];
				}

				projectFiles.push(projects[i].files[j]);
			}
		}

		if (projectFiles.length) {
			var temp = projects[i].name + '@' + projects[i].version;

			// No need to create a list of files if there is only the mainfile.
			if (projectFiles.length !== 1 || projectFiles[0] !== projects[i].mainfile) {
				temp += '(' + projectFiles.join('+') + ')';
			}

			chunks.push(temp);
		}
	}

	return chunks.length
		? [ 'g/' + chunks.join(',') ]
		: [];
}
