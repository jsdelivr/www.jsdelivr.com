// Focuses an input element whenever a key is pressed
// outside of some other key is pressed.

function isChar(code) { //http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
    return code === 32 || (code > 46 && !(code >= 91 && code <= 123) && code !== 144 && code !== 145);
}

module.exports = function($node) {
    var $document = $(window.document);
    function autofocus(event) {
        if (event.target.nodeName != "input" &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            isChar(event.keyCode)) {
            $node.focus();
        }
    }
    $document.on("keydown", autofocus);
    return {
        teardown: function() {
            $document.off("keydown", autofocus);
        }
    };
};
