module.exports = function (collection, group) {
	var isCss = /\.css$/i;
	var isJs = /\.js$/i;
	var css = [];
	var js = [];
	var others = [];
	var cssCount = 0;
	var jsCount = 0;

	// count CSS and JS files and process other files
	for (var i = collection.length - 1; i >= 0; i--) {
		for (var j = collection[i].selectedFiles.length - 1; j >= 0; j--) {
			if (isCss.test(collection[i].selectedFiles[j])) {
				cssCount++;
				css.unshift(collection[i].name + '/' + collection[i].selectedVersion + '/' + collection[i].selectedFiles[j]);
			} else if (isJs.test(collection[i].selectedFiles[j])) {
				jsCount++;
				js.unshift(collection[i].name + '/' + collection[i].selectedVersion + '/' + collection[i].selectedFiles[j]);
			} else {
				// no further processing needed
				others.unshift(collection[i].name + '/' + collection[i].selectedVersion + '/' + collection[i].selectedFiles[j]);
			}
		}
	}

	if (!group) {
		return {
			css: css,
			js: js,
			others: others
		};
	}

	function buildLink(projects, filter, merge) {
		var chunks = [];

		// each project
		for (var i = 0, c = projects.length; i < c; i++) {
			var projectFiles = [];

			// each file
			for (var j = 0, d = projects[i].selectedFiles.length; j < d; j++) {
				if (filter.test(projects[i].selectedFiles[j])) {
					// there is ony one file of this type
					if (!merge) {
						return [ projects[i].name + '/' + projects[i].selectedVersion + '/' + projects[i].selectedFiles[j] ];
					}

					projectFiles.push(projects[i].selectedFiles[j]);
				}
			}

			if (projectFiles.length) {
				var temp = projects[i].name + '@' + projects[i].selectedVersion;

				// no need to create a list of files if there is only the mainfile
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

	return {
		css: buildLink(collection, isCss, cssCount > 1),
		js: buildLink(collection, isJs, jsCount > 1),
		others: others
	};
};