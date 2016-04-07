(function() {
    'use strict';
    var module = angular.module('admin');

    module.controller('AdminController', function(gaAuthentication, gaToast, gaBrowserHistory) {
        //console.log("AdminController")
        if (!gaAuthentication.isAdmin()) {
            gaToast.show('Sorry, you don\'t have permissions to access those pages');
            gaBrowserHistory.back();
        }
    });

}());
