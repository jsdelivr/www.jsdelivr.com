module.exports = (node) => {
	node.addEventListener('click', e => e.stopPropagation());

	return {
		teardown: () => {},
	};
};
