module.exports = function (project, version) {
	for (var i = 0, c = project.assets.length; i < c; i++) {
		if (project.assets[i].version === version) {
			return project.assets[i].files;
		}
	}

	return [];
};