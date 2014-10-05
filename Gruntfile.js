module.exports = function(grunt) {
	grunt.initConfig({
		clean: [ 'app/*' ],
		copy: {
			html: {
				src: 'views/**',
				dest: 'app/'
			},
			js: {
				src: 'app.js',
				dest: 'app/app.js'
			},
			img: {
				src: 'public/img/**',
				dest: 'app/'
			}
		},
		browserify: {
			app: {
				files: {
					'app/public/js/app.js': [ 'public/js/app.js' ]
				},
			options: {
				browserifyOptions: {
					paths: [ __dirname ]
				},
				transform: [ [ 'ractify', { extension: 'html' } ] ]
			}
		}},
		concat: {
			bootstrap: {
				src: [
					'public/js/bootstrap/collapse.js',
					'public/js/bootstrap/dropdown.js',
					'public/js/bootstrap/modal.js',
					'public/js/bootstrap/tooltip.js',
					'public/js/bootstrap/transition.js'
				],
				dest: 'app/public/js/bootstrap.js'
			},
			bundle: {
				src: [ 'app/public/js/bootstrap.js', 'app/public/js/app.js' ],
				dest: 'app/public/js/bundle.js'
			}
		},
		jsbeautifier: {
			options: {
				js: {
					indentWithTabs: true
				}
			},
			files: [ 'app/public/js/app.js', 'app/public/js/bootstrap.js', 'app/public/js/bundle.js' ]
		},
		uglify: {
			app: {
				options: {
					sourceMap: true,
					sourceMapName: 'app/public/js/bundle.min.map'
				},
				files: {
					'app/public/js/bundle.min.js': 'app/public/js/bundle.js'
				}
			}
		},
		less: {
			app: {
				files: {
					'app/public/css/app.css': 'public/less/app.less'
				}
			}
		},
		sprite:{
			app: {
				algorithm: 'binary-tree',
				engine: 'pngsmith',
				src: 'public/img/icons/*.png',
				destImg: 'app/public/img/icons.png',
				destCSS: 'app/public/css/icons.css',
				padding: 2,
				cssTemplate: function (params) {
					var result = '.icon {';
					result += '\n\tdisplay: inline-block;';
					result += '\n\tvertical-align: middle;';
					result += '\n\tbackground-image: url(/img/icons.png);';
					result += '\n\tbackground-size: ' + ( params.items[0].total_width / 2 ) + 'px ' + ( params.items[0].total_height / 2 ) + 'px;\n}\n';

					params.items.forEach(function (item) {
						result += '\n.icon-' + item.name + ' {';
						result += '\n\twidth: ' + ( item.width / 2 ) + 'px;';
						result += '\n\theight: ' + ( item.height / 2 ) + 'px;';
						result += '\n\tbackground-position: ' + ( item.offset_x ? ( item.offset_x / 2 )  + 'px' : 0 ) + ' ' + ( item.offset_y ? ( item.offset_y / 2 ) + 'px' : 0 ) + ';\n}\n';
					});

					return result;
				}
			}
		},
		uncss: {
			app: {
				options: {
					ignore: [ /^(.*)?\.(tooltip|modal|dropdown|icon|project|main|fade|in)([^\w]+\w+)*$/ ],
					stylesheets: [ '../public/css/app.css' ]
				},
				files: {
					'app/public/css/app.css': [ 'app/views/**/*.html' ]
				}
			}
		},
		cssmin: {
			combine: {
				options: {
					keepSpecialComments: 0
				},
				files: {
					'app/public/css/bundle.min.css': [ 'app/public/css/icons.css', 'app/public/css/app.css' ]
				}
			}
		},
		filerev: {
			app: {
				src: [ 'app/public/css/bundle.min.css', 'app/public/img/**/*', 'app/public/js/bundle.min.js' ]
			}
		},
		usemin: {
			html: [ 'app/views/**/*.html' ],
			css: [ 'app/public/css/**/*.css' ],
			js: [ 'app/public/js/**/*.js' ],
			options: {
				assetsDirs: [ 'app/public/' ],
				patterns: {
					js: [
						[/["']([^:"']+\.(?:png|gif|jpe?g))["']/img, 'Image replacement in js files']
					]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-jsbeautifier');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-filerev');
	grunt.loadNpmTasks('grunt-uncss');
	grunt.loadNpmTasks('grunt-usemin');
	grunt.loadNpmTasks('grunt-spritesmith');

	grunt.registerTask('build', [
		'clean',
		'copy',
		'browserify',
		'concat:bootstrap',
		'concat:bundle',
		'jsbeautifier',
		'uglify',
		'less',
		'sprite',
		'uncss',
		'cssmin',
		'filerev',
		'usemin'
	]);

	grunt.registerTask('buildDev', [
		'clean',
		'copy',
		'browserify',
		'concat:bootstrap',
		'concat:bundle',
		'jsbeautifier',
		'uglify',
		'less',
		'sprite',
		'cssmin'
	]);

	grunt.registerTask('default', 'build');
};
