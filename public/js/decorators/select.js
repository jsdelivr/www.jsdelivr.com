module.exports = function (node) {
	var selection = window.getSelection();
	var select = function () {
		selection.selectAllChildren(node);
	};

	node.addEventListener('click', select);

	return {
		teardown: function () {
			node.removeEventListener('click', select);
		}
	};
};
