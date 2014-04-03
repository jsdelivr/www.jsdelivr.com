angular.module('app.algolia', [])
  .service 'AlgoliaClient', ->
    new AlgoliaSearch('OMJJSUW8EV', '677bfc2f1458fa602cb88c825c4d531b')

  .factory 'AlgoliaIndex', (AlgoliaClient, $q) ->
    class Index
      constructor: (name) ->
        @index = AlgoliaClient.initIndex(name)

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
