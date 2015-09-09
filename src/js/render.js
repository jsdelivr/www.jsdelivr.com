import logger from './logger';
import search from './search';

let appLog = logger('app');
const PROJECTS_PATTERN = /^\/projects\/([^/]+)\/?$/i;

export default function (req, res) {
	let path = req.path;
	let renderOptions = { wrapper: 'app.html', el: 'page', data: {} };
	let renderCallback = (error, html) => {
		if (error) {
			// Don't log "Failed to lookup view" errors.
			if (!error.message || error.message.indexOf('Failed to lookup view') === -1) {
				appLog.err(error);
			}

			return res.sendStatus(404);
		}

		res.send(html);
	};

	if (path === '/') {
		return search(req.query.query || '', req.query.page).then((projects) => {
			renderOptions.data.projects = projects;
			res.render('components/index.html', renderOptions, renderCallback);
		}).catch((error) => {
			appLog.err(error);
			res.sendStatus(500);
		});
	}

	if (PROJECTS_PATTERN.test(path)) {
		return search(`name: ${PROJECTS_PATTERN.exec(path)[1]}`, 0).then((projects) => {
			renderOptions.data.project = projects[0];
			renderOptions.data.name = projects[0].name;
			res.render('components/projects.html', renderOptions, renderCallback);
		}).catch((error) => {
			appLog.err(error);
			res.sendStatus(500);
		});
	}

	res.render(`components${path}.html`, renderOptions, renderCallback);
}
