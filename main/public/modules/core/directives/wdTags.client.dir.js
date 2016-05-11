(function() {
    'use strict';
    var module = angular.module('core');

    /**
     * @name gaContent
     * @memberOf angularModule.core
     * @description
     * Creates a overlay content plane, similiar to a dialog.
     */

    module.directive('wdTags', function(wdTags) {
        var link = function(scope, elem, attrs) {
            //scope.navbarId = false;
            // check if name is given
            if (! scope.readonly) { // define a watch ??
                scope.readonly = false;
            }
            scope.static  = attrs.hasOwnProperty("static") ? true : false;
            scope.noSuggestions  = attrs.hasOwnProperty("noSuggestions") ? true : false;
            scope.maxTags = scope.maxTags ? scope.maxTags : 10;
            scope.maxSuggestions = scope.maxTags ? scope.maxTags : 10;
        };

        return {
            link        : link,
            restrict    : 'EA',
            controller: 'wdTagChipsCtrl',
            controllerAs: '$wdTagCtrl',
            bindToController: true,
            //transclude: true,
            scope       : {
                readonly : '@',
                //tagQuery: '&mdContacts',
                //placeholder: '@',
                //secondaryPlaceholder: '@',
                //tagName: '@mdContactName',
                //tagImage: '@mdContactImage',
                //tagEmail: '@mdContactEmail',
                tags: '=ngModel'
                //requireMatch: '=?mdRequireMatch',
                //highlightFlags: '@?mdHighlightFlags
            },
            templateUrl : '/p/modules/core/directives/wdTags.client.dir.html'
        };

    });

}());
