(function() {
    'use strict';
    var module = angular.module('core');

    module.controller('HomeController', function($scope) {
        angular.extend($scope, {
        center: {
            lat: 47.095,
            lng: 9.823,
            zoom: 12 
        },
        defaults: {
            scrollWheelZoom: false
        }}
        )

        return;
    });
}());
