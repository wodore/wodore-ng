(function() {
    'use strict';
    var module = angular.module('core');

    /**
     * @name gaContent
     * @memberOf angularModule.core
     * @description
     * Creates a overlay content plane, similiar to a dialog.
     */

    module.directive('gaContent', function($window) {
        var link = function(scope, elem, attrs) {
            //scope.navbarId = false;
            if (attrs.hasOwnProperty("navbarId")) {
                console.log("Navbar height is: ..." + attrs.navbarId)
                console.log(angular.element(document.getElementById(attrs.navbarId)))
                scope.navbar  = angular.element(document.getElementById(attrs.navbarId));
                console.log(navbarHeight);
            } else {
                var navbarHeight = 0;
                return
            }
            if (attrs.hasOwnProperty("contentViewId")) {
                scope.contentView = angular.element(document.getElementById(attrs.contentViewId));
            } else {
                scope.contentView = angular.element(document.getElementById("content-wrapper"));
            }
            if (attrs.hasOwnProperty("contentFrameId")) {
                scope.contentFrame = angular.element(document.getElementById(attrs.contentViewId));
            } else {
                scope.contentFrame = angular.element(document.getElementById("content-frame"));
            }
            scope.setHeight = function(){
                var navbarHeight = scope.navbar.prop('offsetHeight');
                var contentViewHeight = $window.innerHeight;
                scope.contentView.css('height', contentViewHeight - navbarHeight + 'px');
                scope.contentView.css('min-height', contentViewHeight - navbarHeight + 'px');
                scope.contentFrame.css('max-height', contentViewHeight - navbarHeight - 100 + 'px');
            }
            scope.setHeight()
            //elem.css('height', '400px');
            //
            var w = angular.element($window);
            scope.$watch(function () {
            return {
                h :$window.innerHeight,
                w :$window.innerWidth
                };
            }, function (newValue, oldValue) {
            console.log(newValue, oldValue);
            scope.windowHeight = newValue.h;
            console.log("Window height changed: "+newValue.h)
            scope.setHeight()
            }, true);
            w.bind('resize', function(){
              $scope.$apply();
            })

        };

        return {
            link        : link,
            restrict    : 'EA',
            transclude: true,
            scope       : {
                name : '@'
            },
            templateUrl : '/p/modules/core/directives/gaContent.client.dir.html'
        };

    });

}());
