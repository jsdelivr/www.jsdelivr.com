yaml_config = require 'node-yaml-config'
locals = yaml_config.load(__dirname + '/locals.yaml')

exports.config =
  modules:
    definition: false
    wrapper: false
  paths:
    public: 'tmp/www'
  files:
    javascripts:
      joinTo:
        'js/app.all.js': /^app/
        'js/vendor.js': /^(vendor)/
      order:
        before: [
          'app/js/app.coffee'
        ]

    stylesheets:
      joinTo:
        'css/app.css': /^app/
    templates:
      joinTo:
        'js/dontUseMe' : /^app/

  overrides:
    production:
      paths:
        public: '/tmp/beta.jsdelivr.com/production'

  plugins:
    imageoptimizer:
      path: 'img'
    jade_angular:
      modules_folder: 'templates'
      locals: locals
    sass:
      options:
        includePaths: ['vendor/css']

  # Enable or disable minifying of result js / css files.
  minify: true
