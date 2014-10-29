var fs = require('fs');

var _ = require('lodash');
var Promise = require('bluebird');

var Project = require('./project.js');

var rootDir = __dirname + '/../jsdelivr/files/';

module.exports = function listProjects () {
	return Promise.try(function () {
		var assets = [];
		var projects = [];

		console.log('Listing projects.');

		_.each(fs.readdirSync(rootDir), function (file) {
			if (fs.statSync(rootDir + file).isDirectory()) {
				var project = new Project(file).get();

				// Save each version as a separate record for big projects.
				if (JSON.stringify(project).length > 100000) {
					console.log('Project %s is too big. Each version will be stored as a separate record.', project.name);

					_.each(project.assets, function (entry) {
						assets.push({
							objectID: project.objectID  + '-' + entry.version,
							name: project.name,
							version: entry.version,
							files: entry.files
						});

						// Still too big?
						if (JSON.stringify(assets[assets.length - 1]).length > 100000) {
							console.log('Project %s v%s is too big. Only main file will be included.', project.name, entry.version);
							assets[assets.length - 1].files = [ project.mainfile ];
						}
					});

					project.assets = [];
				}

				projects.push(project);
			}
		});

		console.log('Found %d projects.', projects.length);

		return [ projects, assets ];
	});
};
