module.exports = function(grunt) {
	grunt.initConfig({
		clean: [ 'build/*' ],
		browserify: {
			bundle: {
				files: {
					'build/js/bundle.js': [ 'public/js/app.js' ]
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
			files: [ 'build/js/bundle.js' ]
		},
		uglify: {
			bundle: {
				options: {
					sourceMap: true,
					sourceMapName: 'build/js/bundle.min.map'
				},
				files: {
					'build/js/bundle.min.js': 'build/js/bundle.js'
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'build/css/bundle.min.css': [ 'public/css/modern-ui.css', 'public/css/custom.css' ]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-jsbeautifier');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('build', [
		'clean',
		'browserify',
		'jsbeautifier',
		'uglify',
		'cssmin'
	]);

	grunt.registerTask('default', 'build');
};