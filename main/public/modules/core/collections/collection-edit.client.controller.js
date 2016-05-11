(function() {
    'use strict';
    var module = angular.module('users');

    module.controller('CollectionEditController', function($scope, gaBrowserHistory, gaToast, _, Restangular, gaValidators, gaAuthentication, gaTracking, wdCollections, $log, $q, $mdConstant,$state,Upload) {

        if (!$scope.hasAuthorization()) {
            gaBrowserHistory.back();
        }

        $scope.validators = gaValidators.collection;
        var username = gaAuthentication.user.username;

        $scope.Users = {edit : true};
        $scope.$watch('collection', function(newVal) {
            if (newVal) {
                $scope.editCol = $scope.collection.clone();
            }
        });
    var semicolon = 186;
    $scope.customKeys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA, semicolon];

    var pendingSearch, cancelSearch = angular.noop;
    var cachedQuery, lastSearch;

    /**
     * Async search for contacts
     * Also debounce the queries; since the md-contact-chips does not support this
     */
    $scope.delayedQuerySearch = function(query) {
      cachedQuery = query;
      $log.debug("pendingSearch: "+pendingSearch)
      //$log.debug("debounceSearch: "+debounceSearch())
      if ( !pendingSearch || !debounceSearch() )  {
        cancelSearch();
        pendingSearch = $q(function(resolve, reject) {
          // Simulate async search... (after debouncing)
          //var resolve = resolve
          cancelSearch = reject;
          $log.info("Querry lenght: "+query.length)
          if ( query.length > 0 ){
              var look = Restangular.one('users',username).all('suggestions')//.all(query)
              look.getList({q:query,size:7}).then(
                    function(users){
                        refreshDebounce();
                        // $log.info(users)
                        _.forEach(users, function(value, key) {
                            users[key].permission = 'read'
                            });
                        resolve(users);
                        //resolve(new_users);
                    });
               //resolve()
          } else {
              refreshDebounce();
              resolve([]);
          }
        });
      }
      return pendingSearch;
    }
    var refreshDebounce = function() {
      //lastSearch = 0;
      var now = Date.now();
      pendingSearch = null;
      cancelSearch = angular.noop;
    }
    /**
     * Debounce if querying faster than 300ms
     */
    var debounceSearch = function() {
      var now = Date.now();
      $log.info(now);
      lastSearch = lastSearch ? lastSearch : now;
      $log.info(lastSearch);
      $log.info(now - lastSearch);
      return ((now - lastSearch) < 300);
    }

        $scope.returnIcon = function(perm) {
            var html = "<md-icon md-svg-icon='"+$scope.permIcons[perm]+"' aria-label='"+perm+"' class='md-secondary md-hue-3' ></md-icon>";
            $log.info(html)
            return html
        }

        $scope.uploadFiles = function(files,invalidFiles){
            $scope.$parent.avatar = $scope.avatar
        }

        $scope.save = function() {
            $log.info('Edited collection:');
            $log.info($scope.editCol);

            $scope.editCol.save().then(function(answer) {
                $log.info(answer)
                $scope.editCol.key=answer.key
                _.extend($scope.collection, $scope.editCol);
                if ( $scope.avatar ){
                    $scope.editCol.avatar_url = "/resource/"+$scope.editCol.key+"/avatar/img.jpg0";
                }
                
                $log.info("New users");
                $log.info($scope.users);
                $log.info($scope.usersInit);
                var toRemove = _.differenceWith($scope.usersInit,$scope.users, 
                            function(a,b){
                                return a.user.username == b.user.username
                            });
                var toAdd = _.differenceWith($scope.users,$scope.usersInit, 
                            function(a,b){
                                $log.info("Username: "+a.user.username+" vs "+b.user.username)
                                $log.info("Permission: "+a.permission+" vs "+b.permission)
                                $log.info( (a.user.username === b.user.username))
                                $log.info( (a.permission === b.permission) )
                                $log.info( (a.username === b.username) && (a.permission === b.permission) )
                                return a.user.username === b.user.username && a.permission === b.permission
                            });
                // create user key list
                var userAdd = []
                for (var i = 0; i < toAdd.length; i++) { 
                    var user = toAdd[i];
                    if (user.hasOwnProperty('user_key')){
                        userAdd.push({key:user.user_key,permission:user.permission})
                    }
                }
                var userRm_keys = []
                for (var i = 0; i < toRemove.length; i++) { 
                    var user = toRemove[i];
                    if (user.hasOwnProperty('user_key')){
                        userRm_keys.push(user.user_key)
                    }
                }
                $log.info("User to add:");
                $log.info(toAdd);
                $log.info(userAdd);
                $log.info("User to remove:");
                $log.info(userRm_keys);
                var rest = Restangular.one('collections',$scope.editCol.key).all('users')
                rest.customPUT({user_add:userAdd, user_remove_keys:userRm_keys}).then(function(msg){
                    $scope.usersInit = _.cloneDeep($scope.users);
                    
                });

                if ( $scope.avatar ){
                    var upload = Upload.upload({
                        url: 'api/v1/upload/'+$scope.editCol.key+'/avatar/img.jpg',
                        data: { file: $scope.avatar, 
                                link: 'private',
                                type: 'image/jpeg'}
                    });
                    upload.then(function (response) {
                        var link = response.data.private_links[0];
                        wdCollections.get_async({
                                key : $scope.editCol.key,
                                force : true
                              }).then(function (res){
                            if ( $scope.avatar ){
                                res.avatar_url = link;
                                res.save()
                            }
                            $scope.$parent.collection = res;
                            //gaTracking.eventTrack('Collection edit', $scope.editCol.name);
                            //gaBrowserHistory.back();
                            gaToast.show('Collection was successfully updated');
                            $state.go('collection.view',{collection: res.key})
                        });
                    }, function (response) {
                        if (response.status > 0) {
                            $scope.errorMsg = response.status + ': ' + response.data;
                        }
                    }, function (evt) {
                        avatar.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    });
                } else {
                        $state.go('collection.view',{collection: $scope.editCol.key})
                }

            });
       

        $log.info("Avatar data");
        $log.info($scope.avatar);
        //var avatar = _.cloneDeep($scope.avatar)
        //$log.info(avatar);
        //var restUpload = Restangular.one('upload',$scope.editCol.key).one('avatar','img')
        //restUpload.withHttpConfig({transformRequest: angular.identity}).customPUT({files: avatar, link: 'private'}).then(function(answer){
            //$log.info(answer);
        //});

        

        };
    });
}());
