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
            $scope.collectionsLength = $scope.displayedCollections.length;

            $scope.topIndex = 0
            //ctrl.listReset()
        }




        ctrl.getCollections = function() {
            $log.debug("Load new collections")
            var deferred = $q.defer();
            if (!more) {
                $log.warn("No more collections available from server")
                deferred.reject('No more new values');
                //return;
            } else if ($scope.isLoading) {
                $log.warn("It is already loading new collections")
                deferred.reject('Already loading');
            } else {
                $scope.isLoading = true;
                $log.debug("Load 10 new values")
                $log.debug("Use cursor: "+$scope.nextCursor)
                Restangular.all('collections').getList({cursor: nextCursor, 
                            size: 20,
                           // private: $scope.private
                        }).then(function(collections) {
                    $log.info("New collections are");
                    $log.info(collections);
                    var oldCursor = nextCursor;
                    nextCursor = collections.meta.nextCursor;
                    $log.debug("Next cursor: "+nextCursor)
                    more = collections.meta.more;
                    $scope.totalCount = collections.meta.totalCount;
                    if ( oldCursor === nextCursor ){
                        $log.warn("Cursors are indedical")
                        $log.warn("Do not add to collections array")
                        deferred.reject('Double load');
                    } else {
                        $log.debug("Append to collections array")
                        $scope.collections = $scope.collections.concat(collections);
                        $log.debug("Length of collections array: "+$scope.collections.length)
                        deferred.resolve(collections);
                    }
                }).finally(function() {
                    $log.debug("Finished loading new collections")
                    $log.debug("##########################################")
                    $scope.isLoading = false;
                });
            }
            return deferred.promise;
        };

        

        var collectionRepeat = {
          numLoaded_: 10,
          //toLoad_: 10,
          // Required.
          getItemAtIndex: function(index) {
              //console.log("GET NEW ITEM")
            //console.log($scope.collections)
            $log.debug("Get collection index: "+index)
                    
           // if (index > this.numLoaded_ - 5 && more) {
            if (index > $scope.collectionsLength - 10 && more) {
                $log.warn("Index "+index+" not loaded yet")
                this.fetchMoreItems_(index);
                return null;
            }
            $log.debug("Return collection for index "+index)
            //console.log($scope.collections[index].username)
            var cols = $scope.displayedCollections;
            //var cols = $scope.collections;
            //$log.debug(cols)
            //if ( $scope.private != "both"){
               //var cols = $filter('filter')(cols, {private: $scope.private});
            //}
            //$scope.displayedCollections = cols;
            //$scope.collectionsLength = cols.length;
            //$log.debug(cols)
            var col = cols[index];
            col['nr'] = index + 1;
            col['avatar'] = "https://robohash.org/"+col.id+"?set=set1&bgset=bg2&size=150x150"
            $log.debug(col.id+": "+col.name)
            return col ; //ctrl.getCollections();
          },
          // Required
          // For infinite scroll behavior, we always return a slightly higher
          // number than the previously loaded items.
          getLength: function() {
              if (!more) {
                var length = $scope.collectionsLength;
              } else {
                var length = $scope.collectionsLength + 5;
                //var length =  this.numLoaded_ + 5;
              }
              //return 100;
              $log.info("Collections list length: "+length)
              return length;
          },
          fetchMoreItems_: function(index) {
            // For demo purposes, we simulate loading more items with a timed
            // promise. In real code, this function would likely contain an
            // $http request.
              $log.debug("Fetch more items for index: "+index)
              var self = this;
              //this.toLoad_ += 10;
              ctrl.getCollections().then(
                  function(collections){
                        $log.info("Received new collections")
                        $log.debug("----------------------------")
                        self.numLoaded_ += 10;
                        if ( $scope.private != "both"){
                            $scope.displayedCollections = $filter('filter')($scope.collections, {private: $scope.private});
                        } else {
                            $scope.displayedCollections = $scope.collections;
                        }
                        $scope.collectionsLength = $scope.displayedCollections.length;
                        $log.debug("Loaded colletions are: "+self.numLoaded_)
                  }, function(msg){
                        $log.error("Loading new colletions")
                        $log.error("Error msg: "+msg)
                        $log.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
                  }
              )
            }
        }

        ctrl.listReset = function(){
            $log.info("Reset collection list")
            nextCursor = '';
            more = true;
            $scope.collections = [];
            $scope.displayedCollections = [];
            $scope.collectionsLength = 0;
            $scope.totalCount = 0;
            ctrl.getCollections().then(
                function(collections){
                    $log.info("Received new collections")
                    $log.debug("----------------------------")
                }, function(msg){
                    $log.error("Loading new colletions")
                    $log.error("Error msg: "+msg)
                    $log.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
                }
            )
            $scope.Collections = collectionRepeat;

        }
        //ctrl.listReset()

    });
}());
