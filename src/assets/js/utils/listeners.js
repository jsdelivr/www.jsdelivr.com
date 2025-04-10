const debounce = require('./debounce');
const throttle = require('./throttle');

const addManagedListener = (component, target, event, handler) => {
	target.addEventListener(event, handler);

	component.on('unrender', () => {
		target.removeEventListener(event, handler);
	});
};

module.exports.addManagedListener = addManagedListener;

module.exports.screenWidgetListener = (component) => {
	addManagedListener(component, window, 'resize', debounce(throttle(() => this.set('screenWidth', window.innerWidth), 200)));
};
