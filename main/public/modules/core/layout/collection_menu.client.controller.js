(function() {
    'use strict';
    var module = angular.module('core');
    module.controller('CollectionMenuController', function(
        $scope, Restangular, wdCollections, gaToast, $timeout, $log
    ) {
        $log.info("Init CollectionMenuController");

        $scope.active_collection = wdCollections.get_collection();

        $scope.permIcons = wdCollections.permission_to_icon

        $scope.collections = wdCollections.get_list(true,false);
        $scope.openMenu = function($mdOpenMenu, ev) {
            // Load at least three collections
            if (wdCollections.loadedLen() < 5){
                wdCollections.load(5).then(function(col){
                    $scope.collections = wdCollections.get_list(true,false);
                });
            }
            Restangular.one('collections',$scope.active_collection.key)
                .all('users')
                .getList({size:50})
                .then(function(users){
                    $log.info(users);
                    $scope.col_users = users;
                    //$scope.usersInit = _.cloneDeep(users);
                },function(msg){
                    $log.error(msg);
                    $scope.col_users = [];
            });
            var originatorEv = ev;
            $mdOpenMenu(ev);
        };




    $scope.largeHeader = true;
    $scope.smallHeader = !$scope.largeHeader;
    $scope.showUsers = false;
    $scope.showUsersText = "show";
    $scope.showUsersFn = function() {
      if ($scope.showUsers) {
        $scope.showUsers = false
        $scope.largeHeader = true;
        $scope.smallHeader = !$scope.largeHeader;
        $scope.showUsersText = "show";
      } else {
        $scope.showUsers = true
        $scope.largeHeader = false;
        $scope.smallHeader = !$scope.largeHeader;
        $scope.showUsersText = "add user";
      }
    }
    $scope.collectionLimit = 3
    $scope.showCollections = false
    $scope.showCollectionsText = "more";
    $scope.showCollectionsFn = function() {
      if ($scope.showCollections) {
        $scope.loadCollectionsFn();
        //$scope.showCollections = false
        //$scope.collectionLimit = 3
        //$scope.largeHeader = true;
        //$scope.smallHeader = !$scope.largeHeader;
        //$scope.showCollectionsText = "more";
      } else {
        $scope.showCollections = true
        $scope.collectionLimit = 1000
        $scope.largeHeader = false;
        $scope.smallHeader = !$scope.largeHeader;
        $scope.showCollectionsText = "less";
        $scope.loadCollectionsFn();
      }
    }

    $scope.moreCollections = true
    $scope.loadCollectionsFn = function() {
        wdCollections.load(5).then(function(col){
            $scope.moreCollections = wdCollections.more()
            });
    }

    $scope.goBackFn = function() {
        $scope.largeHeader = true;
        $scope.smallHeader = !$scope.largeHeader;
        $scope.showUsers = false
        $scope.showCollections = false
        $scope.collectionLimit = 3
        $scope.showCollectionsText = "more";
        $scope.showUsersText = "show";
    }

    $scope.newCollection = function(col){
        wdCollections.set_collection(col,false);
        $scope.goBackFn();
    }

    });
}());
