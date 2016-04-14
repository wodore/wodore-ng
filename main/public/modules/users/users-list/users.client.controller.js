(function() {
    'use strict';
    var module = angular.module('admin');

    module.controller('UsersController', function($scope,$q, Restangular) {

        var ctrl = this;
        var nextCursor = '';
        var more = true;
        $scope.users = [];
        $scope.totalCount = 0;
        //$scope.

        ctrl.getUsers = function() {
            var deferred = $q.defer();
            if (!more) {
                deferred.reject('No more new values');
                //return;
            } else {
                $scope.isLoading = true;
                Restangular.all('users').getList({cursor: nextCursor, filter: $scope.filter}).then(function(users) {
                    var oldCursor = nextCursor;
                    console.log('Old cursor: '+oldCursor);
                    nextCursor = users.meta.nextCursor;
                    console.log('Next cursor: '+nextCursor);
                    more = users.meta.more;
                    $scope.totalCount = users.meta.totalCount;
                    if ( oldCursor === nextCursor ){
                        console.log('No new data');
                        deferred.reject('Double load');
                    } else {
                        $scope.users = $scope.users.concat(users);
                        deferred.resolve(users);
                    }
                }).finally(function() {
                    $scope.isLoading = false;
                });
            }
            return deferred.promise;
        };

        ctrl.getUsers().then(
            function(users){
                console.log("===================================");
                console.log("New Users");
                console.log(users);
            }, function(msg){
                console.log("###################################");
                console.log(msg);
            }
        )


        $scope.Users = {
          numLoaded_: 10,
          //toLoad_: 10,
          // Required.
          getItemAtIndex: function(index) {
              //console.log("GET NEW ITEM")
            //console.log($scope.users)
            if (index > this.numLoaded_ - 5) {
              this.fetchMoreItems_(index);
              return null;
            }
            console.log(index)
            console.log($scope.users[index].username)
            return $scope.users[index]; //ctrl.getUsers();
          },
          // Required.
          // For infinite scroll behavior, we always return a slightly higher
          // number than the previously loaded items.
          getLength: function() {
             return $scope.totalCount + 0;
          },
          fetchMoreItems_: function(index) {
            // For demo purposes, we simulate loading more items with a timed
            // promise. In real code, this function would likely contain an
            // $http request.
            var self = this;
            //this.toLoad_ += 10;
            ctrl.getUsers().then(
                function(users){
                    console.log("===================================");
                    console.log("New Users");
                    self.numLoaded_ += 10;
                }, function(msg){
                    console.log("###################################");
                    console.log(msg);
                }
            )
          }
        }

        // This is fired when user scrolled to bottom
        //$scope.$on('mainContentScrolled', function() {
            //ctrl.getUsers();
        //});

    });
}());
