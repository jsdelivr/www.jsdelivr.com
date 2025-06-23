module.exports = (arr, targetObj) => {
	return arr.some(obj => Object.keys(obj).length === Object.keys(targetObj).length
		&& Object.keys(targetObj).every(key => obj[key] === targetObj[key]));
};
