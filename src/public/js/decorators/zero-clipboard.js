export default function (node/*, tooltipPlacement = 'right'*/) {
	/*let clip = */new ZeroClipboard(node);
	/*let $node = $(node);

	$node
		.on('mouseover', () => {
			$node
				.tooltip('destroy')
				.tooltip({
					title: 'Copy to Clipboard',
					placement: tooltipPlacement,
					trigger: 'manual',
					container: 'body',
				})
				.tooltip('show');
		})
		.on('mouseout', () => {
			$node.tooltip('destroy');
		});

	clip.on('aftercopy', () => {
		$node
			.tooltip('destroy')
			.tooltip({
				title: 'Copied!',
				placement: tooltipPlacement,
				trigger: 'manual',
				container: 'body',
			})
			.tooltip('show');
	});*/

	return {
		teardown: () => {}
	};
}
