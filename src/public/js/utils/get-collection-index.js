export default function (collection, project, version = null, file = null) {
	for (let i = 0; i < collection.length; i++) {
		if (collection[i].project === project && (!version || collection[i].version === version) && (!file || collection[i].name === file)) {
			return i;
		}
	}

	return -1;
}
