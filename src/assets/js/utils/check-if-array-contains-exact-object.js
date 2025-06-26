/**
 * Checks if an array contains an object that exactly matches the target object (shallow comparison).
 * @param {Array} arr - Array of objects to search through
 * @param {Object} targetObj - Target object to match against
 * @returns {boolean} True if exact match found, false otherwise
 */
module.exports = (arr, targetObj) => {
	if (!Array.isArray(arr) || typeof targetObj !== 'object' || targetObj === null) {
		return false;
	}

	return arr.some(obj => obj
		&& typeof obj === 'object'
		&& Object.keys(obj).length === Object.keys(targetObj).length
		&& Object.keys(targetObj).every(key => obj[key] === targetObj[key]));
};
