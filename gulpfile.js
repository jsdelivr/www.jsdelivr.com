const gulp = require('gulp');
const less = require('gulp-less');
const rename = require('gulp-rename');
const livereload = require('gulp-livereload');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const minifyCss = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const terser = require('gulp-terser');
const del = require('del');

const rollupStream = require('@rollup/stream');
const rollupRactive = require('rollup-plugin-ractive');
const rollupCommonjs = require('rollup-plugin-commonjs');
const rollupBabel = require('rollup-plugin-babel');
const rollupJson = require('rollup-plugin-json');

const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');

const liveReloadOptions = { port: 35729 };

const srcDir = './src';
const srcAssetsDir = `${srcDir}/assets`;
const srcPublicDir = `${srcDir}/public`;
const dstAssetsDir = './dist/assets';
const dstPublicDir = './dist';
let cache;

const getRollupStream = file => rollupStream({
	cache,
	input: `${srcAssetsDir}/js/${file}`,
	external: [
		'algoliasearch',
		'ractive',
	],
	plugins: [
		{
			resolveId (source) {
				if (/^core-js(?:\/|$)/.test(source)) {
					return require.resolve(source);
				}
			},
		},
		rollupRactive({ format: 'cjs', parseOptions: { interpolate: { script: true, style: true }, includeLinePositions: false, stripComments: false } }),
		rollupCommonjs({ extensions: [ '.html', '.js' ], ignore: [ ] }),
		rollupJson(),
		rollupBabel({ extensions: [ '.html', '.js' ], presets: [] }),
	],
	output: {
		name: 'app',
		format: 'umd',
		sourcemap: true,
		globals: {
			algoliasearch: 'algoliasearch',
			ractive: 'Ractive',
		},
	},
}).on('bundle', (bundle) => {
	cache = bundle;
});

gulp.task('clean', () => {
	return del([ dstPublicDir ]);
});

gulp.task('copy', gulp.parallel(
	() => gulp.src(`${srcAssetsDir}/**/*.!(js|less)`, { base: srcAssetsDir, since: gulp.lastRun('copy') })
		.pipe(gulp.dest(dstAssetsDir))
		.pipe(livereload(liveReloadOptions)),
	() => gulp.src(`${srcPublicDir}/**/*`, { base: srcPublicDir, since: gulp.lastRun('copy') })
		.pipe(gulp.dest(dstPublicDir))
		.pipe(livereload(liveReloadOptions)),
));

gulp.task('less', () => {
	return gulp.src(`${srcAssetsDir}/less/app.less`)
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(less({ relativeUrls: true, strictMath: true }))
		.pipe(rename('app.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstAssetsDir}/css`))
		.pipe(livereload(liveReloadOptions));
});

gulp.task('less:prod', () => {
	return gulp.src(`${srcAssetsDir}/less/app.less`)
		.pipe(sourcemaps.init())
		.pipe(less({ relativeUrls: true, strictMath: true }))
		.pipe(autoprefixer())
		.pipe(minifyCss())
		.pipe(rename('app.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstAssetsDir}/css`));
});

gulp.task('js', gulp.parallel(
	() => getRollupStream('app.js')
		.pipe(plumber())
		.pipe(source('app.js', srcAssetsDir))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstAssetsDir}/js`))
		.pipe(livereload(liveReloadOptions)),
	() => getRollupStream('app-docs.js')
		.pipe(plumber())
		.pipe(source(`app-docs.js`, srcAssetsDir))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstAssetsDir}/js`))
		.pipe(livereload(liveReloadOptions)),
));

gulp.task('js:prod', gulp.parallel(
	() => getRollupStream('app.js')
		.pipe(source('app.js', srcAssetsDir))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(terser({ sourceMap: { includeSources: true } }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstAssetsDir}/js`)),
	() => getRollupStream('app-docs.js')
		.pipe(source(`app-docs.js`, srcAssetsDir))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(terser({ sourceMap: { includeSources: true } }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstAssetsDir}/js`)),
));

gulp.task('build', gulp.series('clean', 'copy', 'less:prod', 'js:prod'));

gulp.task('dev', gulp.series('copy', 'less', 'js'));

gulp.task('serve', () => {
	require('./src');
});

gulp.task('watch', () => {
	livereload.listen(liveReloadOptions);

	gulp.watch([
		`${srcAssetsDir}/**/*.!(html|js|less)`,
		`${srcPublicDir}/**/*`,
	], gulp.series('copy'));

	gulp.watch([
		`${srcDir}/**/*.html`,
		`${srcAssetsDir}/**/*.(js|json)`,
	], gulp.series('js'));

	gulp.watch([
		`${srcAssetsDir}/**/*.less`,
	], gulp.series('less'));
});

gulp.task('default', gulp.series('clean', 'dev', gulp.parallel('serve', 'watch')));
