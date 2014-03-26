#!/usr/bin/env coffee
_ = require 'lodash'
_.str = require 'underscore.string'
byline = require('byline')



config =
  extensions:
    js: ['.min.js.map', '.min.js', '.js']
    css: ['.min.css.map', '.min.css', '.css', 'less', 'scss', 'styl', 'sass']

stream = byline(process.stdin)

stream.on 'data', (line) ->
  data = JSON.parse(line)

  assets = {}
  data.assets.forEach (d) ->
    files = {}
    d.files.forEach (fn) ->
      matched = false
      for own type, exts of config.extensions
        for ext in exts
          if _.str.endsWith(fn, ext)
            key = _.str.rtrim(fn, ext)
            files[type] ||= {}
            files[type][key] ||= { name: key }
            files[type][key].exts ||= []
            files[type][key].exts.push ext
            matched = true
            break
      files['other'] ||= {}
      files['other'][fn] = { name: fn } unless matched

    assets[d.version] =
      js: _.values(files.js)
      other: _.values(files.other)
      css: _.values(files.css)

  # Last 2 versions
  data.assets = {}
  for version in _.first(data.versions, 2)
    data.assets[version] = assets[version]

  process.stdout.write JSON.stringify(data) + "\n"


stream.resume()
