angular.module('app.algolia', [])
  .service 'AlgoliaClient', ->
    new AlgoliaSearch('DBMBXHNL8O', 'ff534b434664d2fb939eace2877ec4dc')

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
