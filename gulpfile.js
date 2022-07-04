const gulp = require('gulp');
const less = require('gulp-less');
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

const srcDir = './src';
const srcAssetsDir = `${srcDir}/public`;
const dstDir = './dist';
let cache;

const getRollupStream = () => rollupStream({
	cache,
	input: `${srcAssetsDir}/js/app.js`,
	external: [
		'algoliasearch',
		'ractive',
	],
	plugins: [
		rollupRactive({ format: 'cjs', parseOptions: { interpolate: { script: true, style: true }, includeLinePositions: false, stripComments: false } }),
		rollupCommonjs({ extensions: [ '.html', '.js' ], ignore: [ ] }),
		rollupJson(),
		rollupBabel({ extensions: [ '.html', '.js' ], presets: [] }),
	],
	output: {
		name: 'app',
		format: 'umd',
		globals: {
			algoliasearch: 'algoliasearch',
			ractive: 'Ractive',
		},
	},
}).on('bundle', (bundle) => {
	cache = bundle;
});

gulp.task('clean', () => {
	return del([ dstDir ]);
});

gulp.task('copy', () => {
	return gulp.src(`${srcAssetsDir}/**/*.!(js|less)`, { base: srcAssetsDir, since: gulp.lastRun('copy') })
		.pipe(gulp.dest(dstDir))
		.pipe(livereload());
});

gulp.task('less', () => {
	return gulp.src([ `${srcAssetsDir}/less/app.less` ])
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(less({ relativeUrls: true, strictMath: true }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstDir}/css`))
		.pipe(livereload());
});

gulp.task('less:prod', () => {
	return gulp.src([ `${srcAssetsDir}/less/app.less` ])
		.pipe(sourcemaps.init())
		.pipe(less({ relativeUrls: true, strictMath: true }))
		.pipe(autoprefixer())
		.pipe(minifyCss())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstDir}/css`));
});

gulp.task('js', () => {
	return getRollupStream()
		.pipe(plumber())
		.pipe(source(`app.js`, srcAssetsDir))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstDir}/js`))
		.pipe(livereload());
});

gulp.task('js:prod', () => {
	return getRollupStream()
		.pipe(source(`app.js`, srcAssetsDir))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(terser({ sourceMap: { includeSources: true } }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(`${dstDir}/js`));
});

gulp.task('build', gulp.series('clean', 'copy', 'less:prod', 'js:prod'));

gulp.task('dev', gulp.series('copy', 'less', 'js'));

gulp.task('serve', () => {
	require('./src');
});

gulp.task('watch', () => {
	livereload.listen();

	gulp.watch([
		`${srcAssetsDir}/**/*.!(html|js|less)`,
	], gulp.series('copy'));

	gulp.watch([
		`${srcDir}/**/*.html`,
		`${srcAssetsDir}/**/*.js`,
	], gulp.series('js'));

	gulp.watch([
		`${srcAssetsDir}/**/*.less`,
	], gulp.series('less'));
});

gulp.task('default', gulp.series('clean', 'dev', gulp.parallel('serve', 'watch')));
