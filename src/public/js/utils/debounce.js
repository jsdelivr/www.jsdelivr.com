export default function (fn, wait = 100) {
	let timeout;

	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(fn, wait, ...args);
	};
}
