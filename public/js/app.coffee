angular.module('app', ['ui.router', 'ngSanitize', 'ui.bootstrap'])
  .service 'Algolia', ->
    new AlgoliaSearch('OMJJSUW8EV', '677bfc2f1458fa602cb88c825c4d531b')

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

  .factory 'Index', (Algolia, $q) ->
    class Index
      constructor: (name) ->
        @index = Algolia.initIndex(name)

      search: (params = {}) ->
        deferred = $q.defer()
        query = params.q || ""
        delete params.q
        @index.search(query, (s, result) ->
          deferred.resolve(result)
        , params)
        deferred.promise

      getObject: (id, params) ->
        deferred = $q.defer()

        @index.getObject(id, (s, result) ->
          deferred.resolve(result)
        , params)
        deferred.promise

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

  .factory 'SearchResponse', ->
    class SearchResponse
      constructor: (scope, response) ->
        scope.hits = @hits(response)
        console.log _.first scope.hits
        scope.info = @info(response)
        scope.page = @page(response)
        console.log scope.page

      info: (data) ->
        start_index = data.page * data.hitsPerPage
        stop_index = Math.min(start_index + data.hitsPerPage, data.nbHits)
        resp =
          start: Math.min(start_index + 1, data.nbHits)
          stop: stop_index
          time: data.processingTimeMS
          total: data.nbHits

      hits: (data) ->
        data.hits

      page: (data) ->
        current = data.page
        resp =
          current: current
          prev: current - 1
          hasPrev: current != 0
          hasNext: current < data.nbPages - 1
          next: current + 1

  .service 'Library', (Index, $location, SearchResponse) ->
    index = new Index('jsdelivr')

    class Library
      get: (id, params) ->
        index.getObject(id, params)
      search: (scope) ->
        state = $location.search()
        params =
          hitsPerPage: 25
          facets: ['*']
          maxValuesPerFacet: 10
          facetFilters: []
          attributesToRetrieve: ['description', 'name', 'lastversion']
          q: state.q

        params.page = state.page if state.page
        scope.hits = null
        index.search(params).then (response) ->
          new SearchResponse(scope, response)
    new Library()
  .controller 'DetailCtrl', ($scope, $stateParams, Library) ->
    $scope.copy_as = 'url'
    Library.get($stateParams.name).then (res) ->
      res.selected_version = res.lastversion
      res.assets = _.indexBy(res.assets, 'version')
      $scope.lib = res

    $scope.file_url = ->
      "//cdn.jsdelivr.net/#{@lib.selected_version}/#{@file}"


  .controller 'SearchCtrl', ($scope, $location, Library) ->
    $scope.search = $location.search().q
    Library.search($scope)

    $scope.reset = ->
      $location.search({})
      Library.search($scope)

    $scope.select = (param_key, value) ->
      $location.search('page', null)
      value = null if value == ""
      $location.search(param_key, value)
      Library.search($scope)

    $scope.select_page = (page) ->
      return if page < 0
      page = null if page == 0
      $location.search('page', page)
      Library.search($scope)
