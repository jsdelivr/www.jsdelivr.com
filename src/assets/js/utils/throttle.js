module.exports = (fn, wait = 100) => {
	let lastCalled, timeout;

	return (...args) => {
		let now = Date.now();

		if (lastCalled && now - lastCalled < wait) {
			clearTimeout(timeout);
			return timeout = setTimeout(fn, wait - (now - lastCalled), ...args);
		}

		lastCalled = now;
		clearTimeout(timeout);
		fn(...args);
	};
};
