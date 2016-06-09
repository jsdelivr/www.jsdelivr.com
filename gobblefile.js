var path = require('path');
var crypto = require('crypto');
var gobble = require('gobble');

var hashes = Object.create(null);
var app = gobble([
		gobble('src/public/js')
			.observeIf(gobble.env() === 'development', 'jscs')
			.observeIf(gobble.env() === 'development', 'jshint')
			.transform('babel', { blacklist: [ 'es6.modules' ] })
			.moveTo('public/js'),
		gobble('src/views')
			.transform('ractive', { type: 'es6' })
			.moveTo('views'),
	])
	.transform('esperanto-bundle', { type: 'umd', name: 'app', entry: 'public/js/app.js', dest: 'public/js/app.js', strict: true });

module.exports = gobble([
	gobble('src'),
	gobble('src/public/js')
		.transform('babel')
		.moveTo('public/js'),
	app.transformIf(gobble.env() === 'development', 'jsbeautify', {
		indent_with_tabs: true,
		space_after_anon_function: true,
		keep_array_indentation: true,
		keep_function_indentation: true,
		space_before_conditional: true,
		end_with_newline: true,
	}),
	app
		.transform('uglifyjs', { ext: '.min.js' })
		.observe(hash),
	gobble('src/public/less')
		.transform('less', { src: 'app.less', dest: 'app.css', strictMath: true })
		.transform('clean-css', { ext: '.min.css' })
		.moveTo('public/css')
		.observe(hash),
	gobble('src')
		.exclude('public/**')
		.observeIf(gobble.env() === 'development', 'jscs')
		.observeIf(gobble.env() === 'development', 'jshint')
		.transform('babel')
		.include( '**/*.js' ),
	gobble('src/public/img')
		.moveTo('public/img'),
	gobble([ 'src/views', 'src/public/js', 'src/public/less' ])
		.include('**/*.html')
		.transform(updateRefs)
		.moveTo('views'),
]);

function hash (inputDir) {
	gobble.sander.lsrSync(inputDir).map(function (file) {
		var code = gobble.sander.readFileSync(path.join(inputDir, file)).toString();
		var fKey = '/' + path.relative('public', file).replace(/\\/g, '/');

		hashes[fKey] = crypto.createHash('sha256').update(code, 'utf8').digest('hex').substr(0, 8);
	});

	return Promise.resolve();
}

function updateRefs (inputDir, outputDir, options) {
	gobble.sander.lsrSync(inputDir).map(function (file) {
		var code = gobble.sander.readFileSync(path.join(inputDir, file)).toString().replace(/<<UPDATE\((.*?)\)>>/g, function ($0, $1) {
			return $1 + (hashes[$1] ? '?v=' + hashes[$1] : '');
		});

		gobble.sander.writeFileSync(path.join(outputDir, file), code);
	});

	return Promise.resolve(options);
}
