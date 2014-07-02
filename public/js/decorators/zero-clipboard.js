var helpers = require('./helpers.js');

module.exports = helpers.create(function (node) {
	var clip = new ZeroClipboard(node);
	var $node = $(node);

	$node
		.on('mouseover', function () {
			$node
				.tooltip('destroy')
				.tooltip({
					title: 'Copy to Clipboard',
					placement: 'top',
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
				placement: 'top',
				trigger: 'manual',
				container: 'body'
			})
			.tooltip('show');
	});
});