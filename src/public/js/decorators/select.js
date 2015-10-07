export default function (node) {
	let $node = $(node);
	let selection = window.getSelection();
	let select = () => {
		if (!selection.toString()) {
			if ($node[0].nodeName.toLowerCase() === 'input') {
				$node.select();
			} else {
				selection.selectAllChildren(node);
			}
		}
	};

	$node.on('click', select);

	return {
		teardown () {
			$node.off('click', select);
		}
	};
}
