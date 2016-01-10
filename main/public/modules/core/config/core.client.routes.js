(function() {
    'use strict';

    var module = angular.module('core');
    module.config(function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('home', {
                url         : '/',
                controller  : 'HomeController',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        template : "<ga-content name='Demo Tester' navbar-id='toolbar-top'></ga-content>"
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            })
            .state('feedback', {
                url         : '/feedback',
                controller  : 'FeedbackController',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/feedback/feedback.client.view.html'
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            });
    });
}());
