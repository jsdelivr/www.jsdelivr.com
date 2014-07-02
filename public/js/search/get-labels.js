module.exports = function (project) {
	var description = (project.description || '').toLowerCase();
	var files = project.assets.map(function (asset) { return asset.files; }).join(',').toLowerCase();
	var name = project.name.toLowerCase();
	var tags = [];

	if (name.substr(0, 2) === 'wp' || name.indexOf('wordpress') !== -1 || description.indexOf('wordpress') !== -1) {
		tags.push({ text: 'WordPress', color: 'blue', keyword: 'wp' });
	}

	if (name.indexOf('jquery') !== -1 || files.indexOf('jquery') !== -1) {
		tags.push({ text: 'jQuery', color: 'dark-blue', keyword: 'jQuery' });
	}

	if (name.indexOf('bootstrap') !== -1 || description.indexOf('bootstrap') !== -1) {
		tags.push({ text: 'Bootstrap', color: 'purple', keyword: 'Bootstrap' });
	}

	if (name.indexOf('font') !== -1 || (project.mainfile.substr(-4) === '.css' && /(font|icon).*\.(otf|eot|svg|ttf|woff)(,|$)/.test(files))) {
		tags.push({ text: 'Font', color: 'emerald', keyword: 'Font' });
	}

	return tags;
};