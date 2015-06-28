var gobble = require('gobble');

var app = gobble([
		gobble('src/public/js')
			.observe('jscs')
			.observe('jshint')
			.transform('babel', { blacklist: [ 'es6.modules' ] })
			.moveTo('public/js'),
		gobble('src/views')
			.transform('ractive', { type: 'es6' })
			.moveTo('views'),
	])
	.transform('esperanto-bundle', { type: 'umd', name: 'app', entry: 'public/js/app.js', dest: 'public/js/app.js', strict: true });

module.exports = gobble([
	app.transform('jsbeautify', {
		indent_with_tabs: true,
		space_after_anon_function: true,
		keep_array_indentation: true,
		keep_function_indentation: true,
		space_before_conditional: true,
		end_with_newline: true,
	}),
	app.transform('uglifyjs', { ext: '.min.js' }),
	gobble('src/public/less')
		.transform('less', { src: 'app.less', dest: 'app.css', strictMath: true })
		.transform('clean-css', { ext: '.min.css' })
		.moveTo('public/css'),
	gobble('src')
		.exclude('public/**')
		.observe('jscs')
		.observe('jshint')
		.transform('babel')
		.include( '**/*.js' ),
	gobble('src/public/img')
		.moveTo('public/img'),
	gobble('src/views')
		.moveTo('views'),
]);
