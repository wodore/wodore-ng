(function() {
    'use strict';

    var module = angular.module('admin');
    module.config(function($stateProvider) {
        $stateProvider
            .state('admin', {
                url         : '/admin',
                abstract    : true,
                controller  : 'AdminController',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        templateUrl : '/p/modules/admin/layout/admin.client.view.html'
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            })
            //.state('admin', {
                //url         : '/admin',
                //abstract    : true,
                //controller  : 'AdminController',
                //templateUrl : '/p/modules/admin/layout/admin.client.view.html'
            //})
            .state('admin.appConfig', {
                url         : '/config',
                controller  : 'AdminAppConfigController',
                templateUrl : '/p/modules/admin/app-config/app-config.client.view.html'
            });
    });
}());
