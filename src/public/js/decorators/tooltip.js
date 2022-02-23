module.exports = (
	node,
	content,
	position = 'bottom',
	elementName = 'div',
	className,
	offsetX,
	offsetY
) => {
	let tooltip, handlers, eventName;
	let getPositionClass = (position) => {
		let resClass;

		switch (position) {
			case 'top':
				resClass = 'ractive-tooltip-top';
				break;
			case 'left':
				resClass = 'ractive-tooltip-left';
				break;
			case 'right':
				resClass = 'ractive-tooltip-right';
				break;
			default:
				resClass = 'ractive-tooltip-bottom';
		}

		return resClass;
	};

	handlers = {
		mouseover () {
			tooltip = document.createElement(elementName);
			tooltip.className = `ractive-tooltip ${getPositionClass(position)}${className ? ` ${className}` : ''}`;
			tooltip.textContent = content;
			node.parentNode.insertBefore(tooltip, node);
		},
		mousemove (event) {
			tooltip.style.left = `${offsetX ? offsetX : event.clientX - Math.round(tooltip.offsetWidth / 2)}px`;
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
