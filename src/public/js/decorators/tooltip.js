module.exports = (
	node,
	content,
	elementName = 'div',
	className,
	offsetX,
	offsetY
) => {
	let tooltip, handlers, eventName;

	handlers = {
		mouseover () {
			tooltip = document.createElement(elementName);
			tooltip.className = `ractive-tooltip${className ? ` ${className}` : ''}`;
			tooltip.textContent = content;
			node.parentNode.insertBefore(tooltip, node);
		},
		mousemove (event) {
			tooltip.style.left = `${offsetX ? offsetX : event.clientX}px`;
			tooltip.style.top = `${offsetY ? offsetY : event.clientY - tooltip.clientHeight - 20}px`;
		},
		mouseleave () {
			tooltip.parentNode.removeChild(tooltip);
		},
	};

	for (eventName in handlers) {
		if (Object.prototype.hasOwnProperty.call(handlers, eventName)) {
			node.addEventListener(eventName, handlers[eventName], false);
		}
	}

	return {
		teardown () {
			for (eventName in handlers) {
				if (Object.prototype.hasOwnProperty.call(handlers, eventName)) {
					node.removeEventListener(eventName, handlers[eventName], false);
				}
			}
		},
	};
};
