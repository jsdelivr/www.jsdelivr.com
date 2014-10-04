var helpers = require('./helpers.js');

module.exports = helpers.create(function (node, tooltipPlacement) {
	tooltipPlacement = tooltipPlacement || 'right';
	var clip = new ZeroClipboard(node);
	var $node = $(node);

	$node
		.on('mouseover', function () {
			$node
				.tooltip('destroy')
				.tooltip({
					title: 'Copy to Clipboard',
					placement: tooltipPlacement,
					trigger: 'manual',
					container: 'body'
				})
				.tooltip('show');
		})
		.on('mouseout', function () {
			$node.tooltip('destroy');
		});

	clip.on('aftercopy', function () {
		$node
			.tooltip('destroy')
			.tooltip({
				title: 'Copied!',
				placement: tooltipPlacement,
				trigger: 'manual',
				container: 'body'
			})
			.tooltip('show');
	});
});
