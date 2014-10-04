module.exports = '/* Copyright 2012 Cedexis Inc. */\n\n(function() {\n    var s = new Date();\n    if (\'object\' === typeof window.radar) {\n        window.radar.stoppedAt = s;\n    }\n})();\n';
