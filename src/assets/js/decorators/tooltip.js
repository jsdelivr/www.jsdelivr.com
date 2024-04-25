let tooltipDecorator = (
	node,
	content,
	position = 'top',
	elementName = 'div',
	className,
	offsetX,
	offsetY,
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
				yPos = top - tooltip.clientHeight - 10;
				break;
			case 'left':
			case 'right':
				yPos = (top + bottom) / 2 - tooltip.clientHeight / 2;
				break;
			default:
				yPos = bottom + 10;
		}

		return Math.round(yPos);
	};

	let getXPos = (position) => {
		let xPos;
		let { left, right } = node.getBoundingClientRect();

		switch (position) {
			case 'left':
				xPos = left - tooltip.clientWidth - 10;
				break;
			case 'right':
				xPos = right + 10;
				break;
			default:
				xPos = left + (right - left) / 2 - tooltip.clientWidth / 2;
		}

		return Math.round(xPos);
	};

	handlers = {
		mouseover () {
			if (document.querySelector('#ractive-tooltip-instance') === null) {
				tooltip = document.createElement(elementName);
				tooltip.className = `ractive-tooltip ${getPositionClass(position)}${className ? ` ${className}` : ''}`;
				content = content.replace(/\n/g, '<br>');
				tooltip.innerHTML = content;
				tooltip.id = 'ractive-tooltip-instance';
				document.body.appendChild(tooltip);
			}
		},
		mousemove () {
			tooltip.style.left = `${offsetX ? offsetX : getXPos(position)}px`;
			tooltip.style.top = `${offsetY ? offsetY : getYPos(position)}px`;
		},
		mouseleave () {
			let tooltipInstance = document.querySelector('#ractive-tooltip-instance');
			tooltipInstance.parentElement.removeChild(tooltipInstance);
		},
	};

	for (eventName in handlers) {
		if (Object.hasOwn(handlers, eventName)) {
			node.addEventListener(eventName, handlers[eventName], false);
		}
	}

	return {
		teardown () {
			for (eventName in handlers) {
				if (Object.hasOwn(handlers, eventName)) {
					node.removeEventListener(eventName, handlers[eventName], false);
				}
			}
		},
	};
};

module.exports = tooltipDecorator;
