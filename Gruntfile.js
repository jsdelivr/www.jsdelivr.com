module.exports = function(grunt) {
	var pkg = grunt.file.readJSON('package.json');

	grunt.initConfig({
		clean: {
			before: [ 'build/*' ],
			after: [ 'tmp/' ]
		},
		browserify: {
			bundle: {
				files: {
					'tmp/js/bundle.js': [ 'public/js/app.js' ]
				},
			options: {
				browserifyOptions: {
					paths: [ __dirname ]
				},
				transform: [ [ 'ractify', { extension: 'html' } ] ]
			}
		}},
		jsbeautifier: {
			options: {
				js: {
					indentWithTabs: true
				}
			},
			files: [ 'tmp/js/bundle.js' ]
		},
		uglify: {
			bundle: {
				options: {
					sourceMap: true,
					sourceMapName: 'tmp/js/bundle.min.map'
				},
				files: {
					'tmp/js/bundle.min.js': 'tmp/js/bundle.js'
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'tmp/css/bundle.min.css': [ 'public/css/modern-ui.css', 'public/css/custom.css' ]
				}
			}
		},
		copy: {
			build: {
				files: [
					{ expand: true, cwd: 'tmp', src: './**', dest: 'build/' + pkg.version }
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-jsbeautifier');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('build', [
		'clean:before',
		'browserify',
		'jsbeautifier',
		'uglify',
		'cssmin',
		'copy',
		'clean:after'
	]);

	grunt.registerTask('default', 'build');
};