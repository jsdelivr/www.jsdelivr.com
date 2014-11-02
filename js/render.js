var appLog = require('./log.js')('app');
var search = require('./search.js');

module.exports = function (req, res, app) {
	var path = req.path;
	var pPattern = /^\/projects\/([^/]+)\/?$/i;
	var renderOptions = { wrapper: 'app.html', el: 'page', data: {} };
	var renderCallback = function (error, html) {
		if (error) {
			appLog.err(error);
			return res.sendStatus(404);
		}

		res.send(html);
	};

	if (path === '/') {
		search(req.query.query || '', req.query.page, function (error, projects) {
			if (error) {
				appLog.err(error);
				return res.sendStatus(500);
			}

			renderOptions.data.projects = projects;
			res.render('components/search.html', renderOptions, renderCallback);
		});
	} else if (pPattern.test(path)) {
		search('name:' + pPattern.exec(path)[1], 0, function (error, projects) {
			if (error) {
				appLog.err(error);
				return res.sendStatus(500);
			}

			renderOptions.data.project = projects[0];
			res.render('components/projects.html', renderOptions, renderCallback);
		});
	} else {
		res.render('components' + path + '.html', renderOptions, renderCallback);
	}
};
