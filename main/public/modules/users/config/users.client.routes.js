(function() {
    'use strict';

    var module = angular.module('users');
    module.config(function($stateProvider) {
        $stateProvider
            .state('signin', {
                url         : '/signin',
                views : {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html',
                    },
                    'content@': {
                        templateUrl : '/p/modules/users/auth/signin.client.view.html',
                        controller  : 'SigninController'
                    }
                },
                data        : {
                    signedOutOnly : true
                }
            })
            .state('signup', {
                url         : '/signup',
                views : {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html',
                    },
                    'content@': {
                        templateUrl : '/p/modules/users/auth/signup.client.view.html',
                        controller  : 'SignupController'
                    }
                },
                data        : {
                    signedOutOnly : true
                }
            })
            .state('signout', {
                url        : '/signout',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html',
                        controller : function(Restangular, gaAuthentication, $state, gaAppConfig) {
                            console.log('signoutController')
                            Restangular.all('auth/signout').post().then(function(appConfig) {
                                gaAuthentication.user = false;
                                _.assignDelete(gaAppConfig, appConfig);
                                $state.go('home');
                            });
                    }
                }
                }
            })
            .state('forgot', {
                url         : '/password/forgot',
                views : {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html',
                    },
                    'content@': {
                        templateUrl : '/p/modules/users/auth/password/forgot.client.view.html',
                        controller  : 'ForgotController',
                    }
                },
                data        : {
                    signedOutOnly : true
                }
            })
            .state('reset', {
                url         : '/password/reset/:token',
                views : {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html',
                    },
                    'content@': {
                        controller  : 'ResetController',
                        templateUrl : '/p/modules/users/auth/password/reset.client.view.html',
                    }
                },
                data        : {
                    signedOutOnly : true
                }
            })
            .state('profile', {
                abstract : true,
                url      : '/user/:username',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        controller  : 'ProfileController',
                        templateUrl : '/p/modules/users/profile/profile.client.view.html',
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            })
            .state('profile.view', {
                url         : '',
                templateUrl : '/p/modules/users/profile/profile-view.client.view.html'
            })
            .state('profile.edit', {
                url         : '/edit',
                controller  : 'ProfileEditController',
                templateUrl : '/p/modules/users/profile/profile-edit.client.view.html'
            })
            .state('profile.password', {
                url         : '/password',
                controller  : 'ProfilePasswordController',
                templateUrl : '/p/modules/users/profile/profile-password.client.view.html'
            })
            .state('users', {
                url         : '/users',
                views: {
                    'main@' : {
                        templateUrl : '/p/modules/core/home/welcome.client.view.html'
                    },
                    'content@' : {
                        controller  : 'UsersController',
                        templateUrl : '/p/modules/users/users-list/users.client.view.html',
                    },
                    'header@' : {
                        templateUrl : '/p/modules/core/home/header.home.view.html'
                    }
                }
            });
    });
}());
