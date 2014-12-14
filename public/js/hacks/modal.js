// Support for zeroClipboard and text selection inside modals in IE.
// Not the best thing for accessibility, but there's no better way.
$.fn.modal.Constructor.prototype.enforceFocus = function () {};
