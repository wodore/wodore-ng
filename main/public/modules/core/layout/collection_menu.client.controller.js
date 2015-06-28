(function() {
    'use strict';
    var module = angular.module('core');

    module.controller('CollectionMenuController', function($scope, Restangular,
                                gaToast, $timeout) {


    var self = this;

    self.simulateQuery = false;
    self.isDisabled    = true;

    self.repos         = loadAll();
    self.querySearch   = querySearch;
    self.selectedItemChange = selectedItemChange;
    self.searchTextChange   = searchTextChange;

    // ******************************
    // Internal methods
    // ******************************

    /**
     * Search for repos... use $timeout to simulate
     * remote dataservice call.
     */
    function querySearch (query) {
      var results = query ? self.repos.filter( createFilterFor(query) ) : self.repos,
          deferred;
      if (self.simulateQuery) {
        deferred = $q.defer();
        $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
        return deferred.promise;
      } else {
        return results;
      }
    }

    function searchTextChange(text) {
      $log.info('Text changed to ' + text);
    }

    function selectedItemChange(item) {
      $log.info('Item changed to ' + JSON.stringify(item));
    }

    /**
     * Build `components` list of key/value pairs
     */
    function loadAll() {
      var repos = [
        {
          'name'      : 'Private',
          'desc'      : 'It\'s your personal group, only you have access.',
          'members'   : '1',
          'icon'      : 'key',
          'forks'     : '16,175',
        },
        {
          'name'      : 'Hiking Group',
          'desc'      : 'Colleciton for hikes.',
          'members'   : '6',
          'icon'      : 'user',
          'forks'     : '760',
        },
        {
          'name'      : 'Mountains',
          'desc'      : 'Let\'s go into the mountains!',
          'members'   : '12',
          'icon'      : 'keys',
          'forks'     : '1,241',
        },
        {
          'name'      : 'Ski with Friends',
          'desc'      : 'What about going skiing as much as possible.',
          'members'   : '4',
          'icon'      : 'cubes',
          'forks'     : '84',
        },
        {
          'name'      : 'Not used anymore',
          'desc'      : 'none',
          'members'   : '21',
          'icon'      : 'bus',
          'forks'     : '303',
        }
      ];
      return repos.map( function (repo) {
        repo.value = repo.name.toLowerCase();
        return repo;
      });
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(item) {
        return (item.value.indexOf(lowercaseQuery) === 0);
      };

    }












    });
}());
