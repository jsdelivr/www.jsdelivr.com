'use strict'

App = angular.module('app', [
  'ngSanitize'
  'ui.router'
  'ui.bootstrap'

  # Internal
  'app.algolia'
  'app.search'
])

App
  .config ($stateProvider, $urlRouterProvider, $locationProvider, $tooltipProvider) ->
    $locationProvider.html5Mode true
    $urlRouterProvider.otherwise("/")
    $stateProvider
      .state 'search',
        url: '/'
        templateUrl: '/templates/search.html'
        controller: 'SearchCtrl'
      .state 'detail',
        url: '/library/:name'
        templateUrl: '/templates/detail.html'
        controller: 'DetailCtrl'
    $tooltipProvider.setTriggers( 'open': 'close' );
    ZeroClipboard.config
      moviePath: '//cdn.jsdelivr.net/zeroclipboard/1.3.3/ZeroClipboard.swf'
      debug: true
      trustedDomains: ["*"]
      allowScriptAccess: "always"
      forceHandCursor: true

  .directive 'diClip', ->
    restrict: 'A'

    link: (scope, element, attrs) ->
      text = 'copy to clipboard'
      scope.tooltip = text
      clip = new ZeroClipboard(element)

      clip.on "load", (client) ->
        client.on 'mouseover', ->
          element.triggerHandler 'mouseenter'
        client.on 'mouseout', ->
          element.triggerHandler 'mouseleave'
          scope.tooltip = text
        client.on 'complete', ->
          scope.$apply ->
            scope.tooltip = 'copied!'
          element.triggerHandler 'mouseleave'
          element.triggerHandler 'mouseenter'
        scope.$on "$destroy", ->
          client.unclip element

