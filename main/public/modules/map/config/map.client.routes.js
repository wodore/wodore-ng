(function() {
    'use strict';

    var module = angular.module('users');
    module.config(function($stateProvider) {
        $stateProvider
            .state('map', {
                url         : '/map',
                controller  : 'SigninController',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/map/layout/map.client.view.html'
                    },
                    'header@' : {
                        templateUrl : '/p/modules/map/layout/header.map.view.html'
                    }
                }
            }).state('map.search', {
                url         : '/search',
                views: {
                    'main@map' : {
                        templateUrl : '/p/modules/map/layout/map.client.view.html'
                    },
                    'header@map' : {
                        templateUrl : '/p/modules/map/layout/header-search.map.view.html'
                    }
                }
            });
    });
}());
