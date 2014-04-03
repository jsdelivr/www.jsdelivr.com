exports.config =
  # See docs at http://brunch.readthedocs.org/en/latest/config.html.
  conventions:
    assets:  /^app[\/\\]+assets[\/\\]+/
  modules:
    definition: false
    wrapper: false
  paths:
    public: 'www'
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


  plugins:
    jade:
      pretty: false # Adds pretty-indentation whitespaces to output (false by default)
    sass:
      options:
        includePaths: ['vendor/css']

  # Enable or disable minifying of result js / css files.
  minify: true
