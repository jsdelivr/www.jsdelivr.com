var getFilesForVersion = require('../utils/get-files-for-version.js');

module.exports = function (project) {
	var files = getFilesForVersion(project, project.selectedVersion);

	// main file, min.* files, everything else
	return files.sort(function (a, b) {
		if (a === project.mainfile) {
			return -1;
		}

		if (b === project.mainfile) {
			return 1;
		}

		if (/[._-]min./i.test(a)) {
			if (/[._-]min./i.test(b)) {
				return a > b || -1;
			}

			return -1;
		}

		if (/[._-]min./i.test(b)) {
			return 1;
		}

		return a > b || -1;
	});
};