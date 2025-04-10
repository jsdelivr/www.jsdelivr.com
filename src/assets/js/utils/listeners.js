const debounce = require('./debounce');
const throttle = require('./throttle');

const addManagedListener = (component, target, event, handler) => {
	if (!target || typeof target.addEventListener !== 'function' || typeof target.removeEventListener !== 'function') {
		console.warn('Invalid target passed to addManagedListener');
		return;
	}

	target.addEventListener(event, handler);

	if (!component || typeof component.on !== 'function') {
		console.warn('Invalid component passed to addManagedListener');
		return;
	}

	component.on('unrender', () => {
		target.removeEventListener(event, handler);
	});
};

module.exports.addManagedListener = addManagedListener;

module.exports.screenWidgetListener = (component) => {
	addManagedListener(component, window, 'resize', debounce(throttle(() => component.set('screenWidth', window.innerWidth), 200)));
};

module.exports.stickySidebarScrollListener = (component) => {
	let sidebar = document.querySelector('.page-content_side-menu');

	if (sidebar) {
		let top = sidebar.getBoundingClientRect().top + document.body.scrollTop;

		let handleStickySidebarScroll = () => {
			let y = document.scrollingElement.scrollTop;
			let currentSidebarTop = sidebar.getBoundingClientRect().top;

			if ((currentSidebarTop <= 20 && currentSidebarTop >= 0) || y > top) {
				sidebar.setAttribute('style', 'position: sticky; top: 20px');
			} else {
				sidebar.removeAttribute('style');
			}
		};

		addManagedListener(component, window, 'scroll', handleStickySidebarScroll);
		handleStickySidebarScroll();
	}
};
