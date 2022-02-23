let tooltipDecorator =  (
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
	let getYPos = (position) => {
		let yPos;
		let { top, bottom } = node.getBoundingClientRect();

		switch (position) {
			case 'top':
				yPos = top - 10;
				break;
			case 'left':
			case 'right':
				yPos = top + (bottom - top) / 2;
				break;
			default:
				yPos = bottom + 10;
		}

		return yPos;
	};

	let getXPos = (position) => {
		let xPos;
		let { left, right } = node.getBoundingClientRect();

		switch (position) {
			case 'left':
				xPos = left - tooltip.clientWidth - 10;
				break;
			case 'right':
				xPos = right + tooltip.clientWidth + 10;
				break;
			default:
				xPos = left + (right - left) / 2 - tooltip.clientWidth / 2;
		}

		return xPos;
	};

	handlers = {
		mouseover () {
			tooltip = document.createElement(elementName);
			tooltip.className = `ractive-tooltip ${getPositionClass(position)}${className ? ` ${className}` : ''}`;
			tooltip.textContent = content;
      document.body.appendChild( tooltip );
		},
		mousemove () {
			tooltip.style.left = `${offsetX ? offsetX : getXPos(position)}px`;
			tooltip.style.top = `${offsetY ? offsetY : getYPos(position)}px`;
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

module.exports = tooltipDecorator;
