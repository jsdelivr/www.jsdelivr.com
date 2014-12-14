module.exports = function (node) {
	var $node = $(node);
	var selection = window.getSelection();
	var select = function () {
		selection.selectAllChildren(node);
	};

	$node.on('click', select);

	return {
		teardown: function () {
			$node.off('click', select);
		}
	};
};
