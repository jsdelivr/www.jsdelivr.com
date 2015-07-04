export default function (node, title, placement = 'top', trigger = 'hover', container = 'body') {
	let $node = $(node).tooltip({
		title,
		placement,
		trigger,
		container,
	});

	return {
		teardown () {
			$node.tooltip('destroy');
		}
	};
}
