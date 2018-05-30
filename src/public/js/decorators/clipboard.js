module.exports = (node, title = 'Copy to Clipboard', tooltipPlacement = 'top', nodeSelector) => {
	let clipboard = new Clipboard(node);
	let $node = nodeSelector ? $(node).parents(nodeSelector).first() : $(node);
	let tooltipOptions = {
		title,
		placement: tooltipPlacement,
		trigger: 'hover',
		container: 'body',
		animation: false,
	};

	function setDefaultTooltip () {
		$node
			.tooltip('destroy')
			.tooltip(tooltipOptions);
	}

	setDefaultTooltip();

	clipboard.on('success', () => {
		$node
			.tooltip('destroy')
			.tooltip($.extend({}, tooltipOptions, { trigger: 'manual', title: 'Copied!' }))
			.tooltip('show');

		setTimeout(setDefaultTooltip, 1000);
	});

	clipboard.on('error', () => {
		$node
			.tooltip('destroy')
			.tooltip($.extend({}, tooltipOptions, { trigger: 'manual', title: 'Press Ctrl+C to copy' }))
			.tooltip('show');

		setTimeout(setDefaultTooltip, 1000);
	});

	return {
		teardown: () => {},
	};
};
