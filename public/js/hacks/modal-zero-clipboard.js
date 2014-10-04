// Support for zeroClipboard inside modals in IE
// https://github.com/zeroclipboard/zeroclipboard/blob/master/docs/instructions.md#workaround-a
if (/MSIE|Trident/.test(window.navigator.userAgent)) {
	(function ($) {
		var zcClass = '.' + ZeroClipboard.config('containerClass');
		var proto = $.fn.modal.Constructor.prototype;

		proto.enforceFocus = function () {
			$(document)
				.off('focusin.bs.modal')/* Guard against infinite focus loop */
				.on('focusin.bs.modal', $.proxy(function (e) {
					if (this.$element[0] !== e.target && !this.$element.has(e.target).length &&
							/* Adding this final condition check is the only real change */ !$(e.target).closest(zcClass).length
					) {
						this.$element.focus();
					}
				}, this));
		};
	})(window.jQuery);
}
