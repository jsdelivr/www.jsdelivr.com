module.exports = function (node, title, placement, trigger, container) {
	var $node = $(node).tooltip({
		title: title,
		placement: placement || 'top',
		trigger: trigger || 'hover',
		container: container || 'body'
	});

	return {
		teardown: function () {
			$node.tooltip('destroy');
		}
	};
};