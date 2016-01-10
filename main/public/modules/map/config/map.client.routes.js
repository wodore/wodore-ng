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
            });
    });
}());
