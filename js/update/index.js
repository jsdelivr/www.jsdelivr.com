var listProjects = require('./lib/list-projects.js');
var updateIndex = require('./lib/update-index.js');
var updateRepository = require('./lib/update-repository.js');

updateRepository()
	.then(listProjects)
	.spread(updateIndex);
