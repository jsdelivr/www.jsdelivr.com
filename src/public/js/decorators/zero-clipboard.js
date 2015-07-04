export default function (node, tooltipPlacement = 'top') {
	let clip = new ZeroClipboard(node);
	let $node = $(node);
	let tooltipOptions = {
		title: 'Copy to Clipboard',
		placement: tooltipPlacement,
		trigger: 'hover',
		container: 'body',
		animation: false,
	};

	$node
		.on('mouseover', () => {
			$node
				.tooltip('destroy')
				.tooltip(tooltipOptions)
				.tooltip('show');
		});

	clip.on('aftercopy', () => {
		$node
			.tooltip('destroy')
			.tooltip($.extend({}, tooltipOptions, { title: 'Copied!' }))
			.tooltip('show');
	});

	return {
		teardown: () => {}
	};
}
