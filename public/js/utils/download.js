module.exports = function (url) {
	var $iframe = $('#download-helper');

	if (!$iframe.length) {
		$iframe = $('<iframe id="download-helper" style="display: none"></iframe>').appendTo('body');
	}

	$iframe.attr('src', url);
};