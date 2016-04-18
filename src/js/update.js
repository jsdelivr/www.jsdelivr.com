import _ from 'lodash';
import request from 'request-promise';
import algoliaSearch from 'algoliasearch';
import { db as algoliaIndex } from './search';
import algoliaConfig from '../config/algolia';
import logger from './logger';

let appLog = logger('app');
let client = algoliaSearch(algoliaConfig.appID, algoliaConfig.writeAccessToken);
let jsDelivrIndex = client.initIndex('jsDelivr');
let jsDelivrAssetsIndex = client.initIndex('jsDelivr_assets');
let projectFields = [ 'name', 'mainfile', 'lastversion', 'description', 'homepage', 'github', 'author', 'versions', 'assets' ];
let compareFields = _.omit(projectFields, [ 'assets' ]);

setInterval(updateIndex, 60000);

function updateIndex () {
	request('https://api.jsdelivr.com/v1/jsdelivr/libraries').then((body) => {
		return JSON.parse(body);
	}).then((data) => {
		_.forEach(data, project => {
			let aProject = algoliaIndex[project.name];

			if (!aProject || !_.isEqual(_.pick(aProject, compareFields), _.pick(project, compareFields))) {
				project = _.pick(project, projectFields);
				project.objectID = project.name;
				project.lastupdate = Date.now();

				appLog.info(`Updating project ${project.name}.`);
				algoliaIndex[project.name] = _.merge({}, project);

				// Save each version as a separate record for big projects.
				if (JSON.stringify(project).length > 100000) {
					let assets = [];
					appLog.info(`Project ${project.name} is too big. Each version will be stored as a separate record.`);

					_.forEach(project.assets, (entry) => {
						assets.push({
							objectID: `${project.objectID}-${entry.version}`,
							name: project.name,
							version: entry.version,
							files: entry.files,
						});

						// Still too big?
						if (JSON.stringify(assets[assets.length - 1]).length > 100000) {
							appLog.notice(`Project ${project.name} v${entry.version} is too big. Only main file will be included.`);
							assets[assets.length - 1].files = [ project.mainfile ];
						}
					});

					jsDelivrAssetsIndex.saveObjects(assets).catch((error) => {
						appLog.err(`Couldn't update project ${project.name} (jsDelivr_assets): ${error}`);
					});

					project.assets = [];
				}

				jsDelivrIndex.saveObject(project).catch((error) => {
					appLog.err(`Couldn't update project ${project.name} (jsDelivr): ${error}`);
				});
			}
		});
	});
}
