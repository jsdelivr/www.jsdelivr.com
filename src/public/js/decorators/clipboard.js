module.exports = (node, title = 'Copy to Clipboard', tooltipPlacement = 'top', nodeSelector) => {
	let clipboard = new ClipboardJS(node);
	let $node = nodeSelector ? $(node).parents(nodeSelector).first() : $(node);
	let tooltipOptions = {
		title,
		placement: tooltipPlacement,
		trigger: 'hover',
		container: 'body',
		animation: false,
	};

	function onDocumentClick (e) {
		if (e.srcElement !== $node[0] && !$(e.srcElement).closest($node[0]).length) {
			setDefaultTooltip();
		}
	}

	function setDefaultTooltip () {
		$node
			.tooltip('destroy')
			.tooltip(tooltipOptions);
	}

	setDefaultTooltip();
	document.addEventListener('click', onDocumentClick);

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
		teardown: () => {
			document.removeEventListener('click', onDocumentClick);
		},
	};
};
