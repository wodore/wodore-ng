(function() {
    'use strict';
    var module = angular.module('core');

    /**
     * @name wdChipStyle
     * @memberOf angularModule.core
     * @description
     * Adds a style to an md-chip
     */


    module.directive('wdChipNgStyle', function($window) {
        return {
            restrict: 'EA',
            link: function(scope, elem, attr) {
            var element = elem.parent().parent(); 
            scope.$watch(attr.wdChipNgStyle, 
                function ngStyleWatchAction(newStyles, oldStyles) {
                    if (oldStyles && (newStyles !== oldStyles)) {
                        forEach(oldStyles, function(val, style) { element.css(style, '');});
                    }
                    if (newStyles) element.css(newStyles);
            }, true);
        }
        }
        });



    module.directive('wdChipClass', function($window) {
        return {
            restrict: 'EA',
            link: function(scope, elem, attrs) {
                var myChip = elem.parent().parent(); 
                myChip.addClass(attrs.wdChipClass);
        }
        }
    });

    }());
