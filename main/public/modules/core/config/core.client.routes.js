(function() {
    'use strict';

    var module = angular.module('core');
    module.config(function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('home', {
                url         : '/',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        controller  : 'HomeController',
                        templateUrl : '/p/modules/core/home/home.client.view.html'
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            })
            .state('feedback', {
                url         : '/feedback',
                //controller  : 'FeedbackController',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        templateUrl : '/p/modules/core/feedback/feedback.client.view.html',
                        controller  : 'FeedbackController'
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            })
            .state('collections', {
                url         : '/collections',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        controller  : 'CollectionsListController',
                        templateUrl : '/p/modules/core/collections/collections-list.client.view.html'
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            })
            .state('collection', {
                abstract : true,
                url      : '/collection/:collection',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        controller  : 'CollectionController',
                        templateUrl : '/p/modules/core/collections/collection.client.view.html'
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            })
            .state('collection.view', {
                url         : '',
                templateUrl : '/p/modules/core/collections/collection-view.client.view.html'
            })
            .state('collection.edit', {
                url         : '/edit',
                controller  : 'CollectionEditController',
                templateUrl : '/p/modules/core/collections/collection-edit.client.view.html'
            }).state('tags', {
                url         : '/tags',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        controller  : 'TagsController',
                        templateUrl : '/p/modules/core/tags/tags-list.client.view.html'
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            })
            ;
    });
}());
