(function() {
    'use strict';
    var module = angular.module('core');

    module.controller('CollectionController', 
            function($scope, Restangular, gaAppConfig, gaAuthentication, 
                        $stateParams, _, $mdDialog, gaToast, $state,
                        $log, wdCollections) {
        //console.log("ProfileController")
        $scope.cfg = gaAppConfig;
        $scope.auth = gaAuthentication;
        $scope.isMyProfile = function() {
            return gaAuthentication.isLogged() && $stateParams.username === gaAuthentication.user.username;
        };

        if ($scope.isMyProfile()) {
            $scope.user = gaAuthentication.user;
        } else {
            Restangular.one('users', $stateParams.username).get().then(function(user) {
                $scope.user = user;
            });
        }

        //$scope.Users = {edit : false};
        $scope.avatar = false
        $scope.users = [];
        $scope.usersInit = [];
        $scope.permIcons = wdCollections.permission_to_icon
        var key = $stateParams.collection
        if (key === 'add'){
            $scope.users = [{'user':gaAuthentication.user,'permission':'creator'}];
            $scope.usersInit = _.cloneDeep($scope.users);
            //$scope.collection = {permission:'creator',active:true};
            $scope.collection = Restangular.restangularizeElement(null, {}, 'collections/add');
            $scope.collection.permission = 'creator';
            $scope.collection.active = true;
            $scope.collection.avatar_url = "";

        } else {

            wdCollections.get_async({key:key}).then(function(get){
                    $scope.collection = get;
                    Restangular.one('collections',get.key).all('users').getList({size:50}).then(function(users){
                        //$log.info(users);
                        $scope.users = users;
                        $scope.usersInit = _.cloneDeep(users);
                    },function(msg){
                        $log.error(msg);
                        $scope.users = [];
                    });
                });
        }
        //$scope.collection.test = "BLa bluu";

        $scope.getAvailableSocialAccounts = function() {
            if (!$scope.user) {
                return;
            }
            return _.pick($scope.socialAccounts, function(soc, socKey) {
                /*jslint unparam:true*/
                return !!$scope.user[socKey];
            });
        };

        $scope.hasAuthorization = function() {
            return $scope.isMyProfile() || $scope.auth.isAdmin();
        };

        $scope.showDeleteUserDialog = function(ev) {
            var confirm = $mdDialog.confirm()
                .title('Do you really want to delete user ' + $scope.user.username)
                .content('Note, these deletion is irreversible')
                .ariaLabel('Delete User')
                .ok('Delete')
                .cancel('Cancel')
                .targetEvent(ev);
            $mdDialog.show(confirm).then(function() {
                $scope.user.remove().then(function() {
                    gaToast.show('User ' + $scope.user.username + ' was deleted');
                    $state.go('users');
                });
            });
        };

        $scope.socialAccounts = {
            facebook  : {
                domain : 'facebook.com',
                name   : 'Facebook'
            },
            twitter   : {
                domain : 'twitter.com',
                name   : 'Twitter'
            },
            gplus     : {
                domain : 'plus.google.com',
                name   : 'Google Plus'
            },
            instagram : {
                domain : 'instagram.com',
                name   : 'Instagram'
            },
            linkedin  : {
                domain : 'linkedin.com/in',
                name   : 'Linkedin'
            },
            github    : {
                domain : 'github.com',
                name   : 'Github'
            }
        };
    });
}());
