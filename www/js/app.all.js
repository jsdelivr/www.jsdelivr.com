'use strict';
var App;

App = angular.module('app', ['ngSanitize', 'ui.router', 'ui.bootstrap', 'app.algolia', 'app.search', 'app.templates']);

App.config(function($stateProvider, $urlRouterProvider, $locationProvider, $tooltipProvider) {
  $locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise("/");
  $stateProvider.state('search', {
    url: '/',
    templateUrl: 'app/templates/search.jade',
    controller: 'SearchCtrl'
  }).state('detail', {
    url: '/library/:name',
    templateUrl: 'app/templates/detail.jade',
    controller: 'DetailCtrl'
  }).state('network', {
    url: '/network',
    templateUrl: 'app/templates/pages/network.jade'
  }).state('about', {
    url: '/about',
    templateUrl: 'app/templates/pages/about.jade'
  }).state('faq', {
    url: '/faq',
    templateUrl: 'app/templates/pages/faq.jade'
  });
  $tooltipProvider.setTriggers({
    'open': 'close'
  });
  return ZeroClipboard.config({
    moviePath: '//cdn.jsdelivr.net/zeroclipboard/1.3.3/ZeroClipboard.swf',
    debug: true,
    trustedDomains: ["*"],
    allowScriptAccess: "always",
    forceHandCursor: true
  });
}).directive('diClip', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var clip, text;
      text = 'copy to clipboard';
      scope.tooltip = text;
      clip = new ZeroClipboard(element);
      return clip.on("load", function(client) {
        client.on('mouseover', function() {
          return element.triggerHandler('mouseenter');
        });
        client.on('mouseout', function() {
          element.triggerHandler('mouseleave');
          return scope.tooltip = text;
        });
        client.on('complete', function() {
          scope.$apply(function() {
            return scope.tooltip = 'copied!';
          });
          element.triggerHandler('mouseleave');
          return element.triggerHandler('mouseenter');
        });
        return scope.$on("$destroy", function() {
          return client.unclip(element);
        });
      });
    }
  };
});

;angular.module('app.algolia', []).service('AlgoliaClient', function() {
  return new AlgoliaSearch('DBMBXHNL8O', 'ff534b434664d2fb939eace2877ec4dc');
}).factory('AlgoliaIndex', function(AlgoliaClient, $q) {
  var Index;
  return Index = (function() {
    function Index(name) {
      this.index = AlgoliaClient.initIndex(name);
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
});

;angular.module('app.search', []).factory('SearchResponse', function() {
  var SearchResponse;
  return SearchResponse = (function() {
    function SearchResponse(scope, response) {
      scope.hits = this.hits(response);
      console.log(_.first(scope.hits));
      scope.info = this.info(response);
      scope.page = this.page(response);
      console.log(scope.page);
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
}).service('Library', function(AlgoliaIndex, $location, SearchResponse) {
  var Library, index;
  index = new AlgoliaIndex('jsdelivr');
  Library = (function() {
    function Library() {}

    Library.prototype.get = function(id, params) {
      return index.getObject(id, params);
    };

    Library.prototype.search = function(scope) {
      var params, state;
      state = $location.search();
      params = {
        hitsPerPage: 25,
        facets: ['*'],
        maxValuesPerFacet: 10,
        facetFilters: [],
        attributesToRetrieve: ['description', 'name', 'lastversion'],
        q: state.q
      };
      if (state.page) {
        params.page = state.page;
      }
      scope.hits = null;
      return index.search(params).then(function(response) {
        return new SearchResponse(scope, response);
      });
    };

    return Library;

  })();
  return new Library();
}).controller('DetailCtrl', function($scope, $stateParams, Library) {
  $scope.copy_as = 'url';
  Library.get($stateParams.name).then(function(res) {
    res.selected_version = res.lastversion;
    res.assets = _.indexBy(res.assets, 'version');
    return $scope.lib = res;
  });
  return $scope.file_url = function() {
    return "//cdn.jsdelivr.net/" + this.lib.selected_version + "/" + this.file;
  };
}).controller('SearchCtrl', function($scope, $location, Library) {
  $scope.search = $location.search().q;
  Library.search($scope);
  $scope.reset = function() {
    $location.search({});
    return Library.search($scope);
  };
  $scope.select = function(param_key, value) {
    $location.search('page', null);
    if (value === "") {
      value = null;
    }
    $location.search(param_key, value);
    return Library.search($scope);
  };
  return $scope.select_page = function(page) {
    if (page < 0) {
      return;
    }
    if (page === 0) {
      page = null;
    }
    $location.search('page', page);
    return Library.search($scope);
  };
});

;