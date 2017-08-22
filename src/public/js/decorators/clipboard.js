module.exports = (node, tooltipPlacement = 'top') => {
	let clipboard = new Clipboard(node);
	let $node = $(node);
	let tooltipOptions = {
		title: 'Copy to Clipboard',
		placement: tooltipPlacement,
		trigger: 'hover',
		container: 'body',
		animation: false,
	};

	$node.on('mouseover', () => {
		$node
			.tooltip('destroy')
			.tooltip(tooltipOptions)
			.tooltip('show');
	});

	clipboard.on('success', () => {
		$node
			.tooltip('destroy')
			.tooltip($.extend({}, tooltipOptions, { title: 'Copied!' }))
			.tooltip('show');
	});

	clipboard.on('error', () => {
		$node
			.tooltip('destroy')
			.tooltip($.extend({}, tooltipOptions, { title: 'Press Ctrl+C to copy' }))
			.tooltip('show');
	});

	return {
		teardown: () => {},
	};
};
