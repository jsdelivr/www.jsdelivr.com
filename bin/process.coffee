#!/usr/bin/env coffee
_ = require 'lodash'
_.str = require 'underscore.string'
process.stdin.resume()

process.stdin.on 'data', (line) ->
  data = JSON.parse(line)

  assets = {}
  data.assets.forEach (d) ->
    files = {}
    d.files.forEach (fn) ->
      switch
        when _.str.endsWith(fn, '.min.js.map')
          key = _.str.rtrim(fn, '.min.js.map')
          files[key] ||= { name: key, extensions: [] }
          files[key].extensions.push 'min.js.map'
        when _.str.endsWith(fn, '.min.js')
          key = _.str.rtrim(fn, '.min.js')
          files[key] ||= { name: key, extensions: [] }
          files[key].extensions.push 'min.js'
        when _.str.endsWith(fn, '.js')
          key = _.str.rtrim(fn, '.js')
          files[key] ||= { name: key, extensions: [] }
          files[key].extensions.push 'js'
        else
          files[fn] ||= { name: fn, extensions: [] }
    assets[d.version] = _.values(files)
  process.stdout.write JSON.stringify assets[data.lastversion]

