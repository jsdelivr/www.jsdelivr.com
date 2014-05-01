#!/usr/bin/env coffee
_ = require 'lodash'
_.str = require 'underscore.string'
byline = require('byline')
github = require('octonode')
url = require("url")
client = github.client(process.env.GH_TOKEN)

stream = byline(process.stdin)

stream.on 'data', (line) ->
  data = JSON.parse(line)
  if data.github
    gh = url.parse(data.github)
    if gh.host = 'github.com'
      #/padolsey/jQuery-Plugins/tree/master/cross-domain-ajax/
      repo = _.first(gh.pathname.split('/'), 3).join('/')
      client.get '/repos' + repo, {}, (err, status, body) ->
        data.gh = _.pick(body, 'stargazers_count', 'subscribers_count', 'forks')
        process.stdout.write JSON.stringify(data) + "\n"
    else
      process.stdout.write JSON.stringify(data) + "\n"


stream.resume()
