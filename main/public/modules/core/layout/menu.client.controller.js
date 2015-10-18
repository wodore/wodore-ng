(function() {
    'use strict';
    var module = angular.module('core');

    module.controller('TopMenuController', function($scope, gaAuthentication,
                                gaAppConfig, Restangular,
                                gaToast, $timeout, $mdMenu, $mdDialog) {
        $scope.auth = gaAuthentication;
        $scope.cfg = gaAppConfig;

        $scope.generateDatabase = function() {
            console.log("Generate database...")
            gaToast.show('Generating database...', {delay : 0});
            Restangular.all('generate_database').post().then(function() {
                gaToast.update('Database was successfully generated. You can sign in with admin:123456');
                $timeout(gaToast.hide, 5000);
            });
        };
        
        $scope.editConfig = function() {
            console.log("Edit Config pop-up")
            $mdDialog.show({
              controller: DialogController,
              templateUrl: '/p/modules/core/layout/add_marker.client.view.template.html',
              parent: angular.element(document.body),
              targetEvent: event,
              scope : $scope,
              preserveScope: true
            })
        };

        function DialogController($scope, $mdDialog) {
          console.log($scope)

          $scope.hide = function() {
            console.log("hide")
            $mdDialog.hide();
          };
          $scope.save = function() {
            console.log($scope.marker_new)
            $scope.marker_new[0].draggable = false
            $scope.markers.push($scope.marker_new[0])
            $mdDialog.hide();
          };
          $scope.cancel = function() {
            console.log("cancel")
            $mdDialog.cancel();
          };
          $scope.answer = function(answer) {
            $mdDialog.hide(answer);
            console.log(answer)
          };
        }
        $scope.$on('$stateChangeSuccess', $scope.closeSidenav);
    });
}());
