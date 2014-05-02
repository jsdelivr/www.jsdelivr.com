#!/usr/bin/env coffee
_ = require 'lodash'
_.str = require 'underscore.string'
byline = require('byline')
github = require('octonode')
url = require("url")
client = github.client(process.env.GH_TOKEN)

stream = byline(process.stdin)


github_is_correct = (data) ->
  if data.github
    gh = url.parse(data.github)
    console.log data.name unless gh.host == 'github.com'

no_github_but_gh_homepage = (data) ->
  if !data.github and data.homepage
    gh = url.parse(data.homepage)

    if gh.host == 'github.com'
      console.log data.name

no_github = (data) ->
  if !data.github
    console.log data.name
stream.on 'data', (line) ->
  data = JSON.parse(line)
  no_github(data)


stream.resume()
