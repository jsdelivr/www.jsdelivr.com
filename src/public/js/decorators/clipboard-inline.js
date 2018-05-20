module.exports = (node) => {
	let clipboard = new Clipboard(node);
	let $node = $(node);
	let initialTxt = $node.text();
	let timer;

	function setText(txt) {
		$node.text(txt);
		window.clearTimeout(timer);
		timer = window.setTimeout(() => $node.text(initialTxt), 1000);
	}

	clipboard.on('success', () => setText('Copied!'));
	clipboard.on('error', () => setText('Press Ctrl+C to copy'));

	return {
		teardown: () => window.clearTimeout(timer),
	};
};
