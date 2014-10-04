module.exports = function (collection, name) {
	for (var i = 0, c = collection.length; i < c; i++) {
		if (collection[i].name === name) {
			return i;
		}
	}

	return -1;
};
