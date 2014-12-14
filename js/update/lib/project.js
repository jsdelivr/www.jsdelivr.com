var fs = require('fs');

var _ = require('lodash');
var ini = require('ini');
var readdirRecursive = require('fs-readdir-recursive');
var versionCompare = require('./version-compare.js');

var rootDir = __dirname + '/../jsdelivr/files/';

function Project (name) {
	this.name = name;
	this.objectID = name;
}

Project.prototype.get = function () {
	var project = {
		name: this.name,
		objectID: this.objectID,
		assets: this.getAssets(),
		versions: this.getVersions()
	};

	return _.assign(project, {
		lastversion: project.versions[0]
	}, this.getMetadata())
};

Project.prototype.getAssets = function () {
	var name = this.name;
	var assets = [];

	_.each(this.getVersions(), function (version) {
		assets.push({
			files: readdirRecursive(rootDir + name + '/' + version).map(function (file) { return file.replace(/\\/g, '/'); }),
			version: version
		});
	});

	return assets;
};

Project.prototype.getMetadata = function () {
	try {
		return ini.parse(fs.readFileSync(rootDir + this.name + '/info.ini', 'utf8'));
	} catch (e) {}

	return {};
};

Project.prototype.getVersions = function () {
	var name = this.name;

	return fs.readdirSync(rootDir + name).filter(function (file) {
		return fs.statSync(rootDir + name + '/' + file).isDirectory();
	}).sort(versionCompare);
};

module.exports = Project;
