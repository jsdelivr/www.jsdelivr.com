var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module('app', ['ui.router', 'ngSanitize']).service('Algolia', function() {
  return new AlgoliaSearch('OMJJSUW8EV', '677bfc2f1458fa602cb88c825c4d531b');
}).config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise("/");
  $stateProvider.state('search', {
    url: '/',
    templateUrl: 'templates/search.html',
    controller: 'SearchCtrl'
  });
  return ZeroClipboard.config({
    moviePath: '//cdn.jsdelivr.net/zeroclipboard/1.3.3/ZeroClipboard.swf',
    debug: true,
    trustedDomains: ["*"],
    allowScriptAccess: "always",
    forceHandCursor: true
  });
}).factory('Index', function(Algolia, $q) {
  var Index;
  return Index = (function() {
    function Index(name) {
      this.index = Algolia.initIndex(name);
    }

    Index.prototype.search = function(params) {
      var deferred, query;
      if (params == null) {
        params = {};
      }
      deferred = $q.defer();
      query = params.q || "";
      delete params.q;
      this.index.search(query, function(s, result) {
        return deferred.resolve(result);
      }, params);
      return deferred.promise;
    };

    Index.prototype.getObject = function(id, params) {
      var deferred;
      deferred = $q.defer();
      this.index.getObject(id, function(s, result) {
        return deferred.resolve(result);
      }, params);
      return deferred.promise;
    };

    return Index;

  })();
}).directive('diClip', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var clip;
      clip = new ZeroClipboard(element);
      return clip.on("load", function(client) {
        return scope.$on("$destroy", function() {
          return client.unclip(element);
        });
      });
    }
  };
}).factory('SearchResponse', function() {
  var SearchResponse;
  return SearchResponse = (function() {
    function SearchResponse(scope, response) {
      scope.hits = this.hits(response);
      console.log(_.first(scope.hits));
      scope.info = this.info(response);
      scope.page = this.page(response);
    }

    SearchResponse.prototype.info = function(data) {
      var resp, start_index, stop_index;
      start_index = data.page * data.hitsPerPage;
      stop_index = Math.min(start_index + data.hitsPerPage, data.nbHits);
      return resp = {
        start: Math.min(start_index + 1, data.nbHits),
        stop: stop_index,
        time: data.processingTimeMS,
        total: data.nbHits
      };
    };

    SearchResponse.prototype.hits = function(data) {
      return data.hits;
    };

    SearchResponse.prototype.page = function(data) {
      var current, resp;
      current = data.page;
      return resp = {
        current: current,
        prev: current - 1,
        hasPrev: current !== 0,
        hasNext: current < data.nbPages - 1,
        next: current + 1
      };
    };

    return SearchResponse;

  })();
}).service('Library', function(Index, $location, SearchResponse) {
  var Library, LibrarySearchResponse, index, _ref;
  index = new Index('jsdelivr');
  LibrarySearchResponse = (function(_super) {
    __extends(LibrarySearchResponse, _super);

    function LibrarySearchResponse() {
      _ref = LibrarySearchResponse.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LibrarySearchResponse.prototype.hits = function(data) {
      return _.map(LibrarySearchResponse.__super__.hits.call(this, data), function(lib) {
        var assets;
        assets = _.indexBy(lib.assets, 'version');
        _.each(assets, function(a) {
          return a.files = _.groupBy(a.files, function(fn) {
            return fn.split('.')[0];
          });
        });
        lib.assets = assets;
        return lib;
      });
    };

    return LibrarySearchResponse;

  })(SearchResponse);
  Library = (function() {
    function Library() {}

    Library.prototype.search = function(scope) {
      var params, state;
      state = $location.search();
      params = {
        hitsPerPage: 10,
        facets: ['*'],
        maxValuesPerFacet: 10,
        facetFilters: [],
        q: state.q
      };
      if (state.page) {
        params.page = state.page;
      }
      scope.hits = [];
      return index.search(params).then(function(response) {
        return new LibrarySearchResponse(scope, response);
      });
    };

    return Library;

  })();
  return new Library();
}).controller('SearchCtrl', function($scope, $location, Library) {
  Library.search($scope);
  $scope.assets_for_version = function(version) {};
  $scope.select = function(param_key, value) {
    $location.search('page', null);
    if (value === "") {
      value = null;
    }
    $location.search(param_key, value);
    return Library.search($scope);
  };
  return $scope.select_page = function(page) {
    if (page === 0) {
      page = null;
    }
    $location.search('page', page);
    return Library.search($scope);
  };
});
