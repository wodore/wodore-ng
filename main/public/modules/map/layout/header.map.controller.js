(function() {
    'use strict';
    var module = angular.module('map');

    module.controller('MapHeaderController', function($scope, Restangular,
                                gaToast, $timeout, $document) {
    var self = this;
    $scope.search = false;
    $scope.searchIcon = 'action:search';
    $scope.toggleSearchInput = function() {
        $scope.search = !$scope.search;
        if ($scope.search) {
            $scope.searchIcon = 'navigation:arrow_back';
            console.log(angular.element( document.querySelector( '#search-input' ) ))
            angular.element(document.querySelector('#search-input')).focus();
        } else {
            $scope.searchIcon = 'action:search';
        }
    }  
    });
}());
