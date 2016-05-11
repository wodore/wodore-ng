(function() {
    'use strict';
    var module = angular.module('core');

    module.controller('CollectionsListController', function($scope,$q, Restangular,$log, $filter, wdCollections) {
        $log.debug("Init CollectionsListController")

        //wdCollections.load(10,{private: true}).then(function(){
            //$log.info(wdCollections.more)
            //wdCollections.load(30).then(function(){
                //$log.info(wdCollections.more)
                //$log.info(wdCollections.listById)
                //$log.info(wdCollections.indexToId)
                //$log.warn(wdCollections.get({index: 10}));
                //$log.warn(wdCollections.get({i: 0}));
                //$log.warn(wdCollections.get({i: 0,sort: 'cnt'}));
                //$log.warn(wdCollections.get_list());
                //$log.warn(wdCollections.get_list(false,['cnt','name'],['asc','desc']));
                //$log.warn(wdCollections.get_list(true,'created','desc'));
            //});
        //});

        var ctrl = this;
        var nextCursor = '';
        var more = true;
        $scope.collections = [];
        $scope.displayedCollections = [];
        $scope.collectionsLength = 10;
        $scope.totalCount = 0;
        $scope.topIndex = 0;
        //$scope.showAll = false;
        //$scope.

        $scope.private = "both"
        //$scope.private = true
        $scope.edit = false

        $scope.privateCheck = function(){
            if ($scope.private === false || $scope.private === "both"){
                return ""
            } else {
                return true
            }
        }
        $scope.privateIndeterminate = function(){
            if ($scope.private === "both"){
                return true
            } else {
                return false
            }
        }
        $scope.togglePrivate = function(){
            $scope.topIndex = 0
            if ($scope.private === "both"){
                $scope.private = true
            } else if ($scope.private === true){
                $scope.private = false
            } else {
                $scope.private = "both"
            }
            $log.debug("Show private colletions: "+$scope.private)

            if ( $scope.private != "both"){
                $scope.displayedCollections = $filter('filter')($scope.collections, {private: $scope.private});
            } else {
                $scope.displayedCollections = $scope.collections;
            }

            $scope.topIndex = 0
            filterLoad = {private : $scope.private, showAll : $scope.showAll} 
            filterName = "F-"+$scope.private+$scope.showAll
            $scope.collectionsLength = wdCollections.loadedLen(filter); 
            $scope.totalCount = wdCollections.totalLen(); 
            wdCollections.more[filterName] = true;
            wdCollections.load(5,filterLoad,filterName).then(function(){
                $log.debug(wdCollections.getList())
            });
            //ctrl.listReset()
        }
        $scope.toggleShowAll = function(){
            $scope.showAll = $scope.showAll ? false : true;
        }

        var filterLoad = {private : $scope.private, showAll : $scope.showAll} 
        var filter = function(o) { 
            if ($scope.private === "both"){
                return true
            }
            if ($scope.private === o.private){
                return true
            }
            return false
        }
        var filterName = "F-"+$scope.private+$scope.showAll
        wdCollections.load(10,filterLoad,filterName).then(function(){
            $log.debug(wdCollections.getList())
        }
        );

        var collectionRepeat = {
          getItemAtIndex: function(index) {
            $log.debug("Get collection index: "+index)
            if (index > wdCollections.loadedLen(filter) - 10 && wdCollections.more(filterName)) {
                $log.warn("Index "+index+" not loaded yet")
                wdCollections.load(15,filterLoad,filterName);
                return null;
            }
            $log.debug("Return collection for index "+index)
            return wdCollections.get({i: index, filter : filter, filterName : filterName}) ; //ctrl.getCollections();
          },
          getLength: function() {
              if (!wdCollections.more(filterName)) {
                var length = wdCollections.loadedLen(filter);
              } else {
                var length = wdCollections.loadedLen(filter) + 5;
              }
              $log.info("Collections list length: "+length)
              return length;
          },
        }
        $scope.Collections = collectionRepeat;
//
//        ctrl.listReset = function(){
//            $log.info("Reset collection list")
//            //nextCursor = '';
//            //more = true;
//            //$scope.collections = [];
//            //$scope.displayedCollections = [];
//            //$scope.collectionsLength = 0;
//            //$scope.totalCount = 0;
//            wdCollections.load(20);
//            //ctrl.getCollections().then(
//                //function(collections){
//                    //$log.info("Received new collections")
//                    //$log.debug("----------------------------")
//                //}, function(msg){
//                    //$log.error("Loading new colletions")
//                    //$log.error("Error msg: "+msg)
//                    //$log.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
//                //}
//            //)
//            $scope.Collections = collectionRepeat;
//
//        }
        //ctrl.listReset()

    });
}());
