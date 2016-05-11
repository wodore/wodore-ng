/**
 * @namespace angularModule
 */

// Init the application configuration module for AngularJS application
var AppConfig = (function() {
    'use strict';
    // Init module configuration options
    var applicationModuleName = 'wodore-ng';
    var applicationModuleVendorDependencies = [
        'ngAnimate',
        'ngMessages',
        'restangular',
        'ui.router',
        'noCAPTCHA',
        'ngMaterial',
        'lrInfiniteScroll',
        'angulartics',
        'angulartics.google.analytics',
        //'leaflet-directive',
        'nemLogging',
        'ui-leaflet',
        'ngFileUpload',
    ];

    // Add a new vertical module
    var registerModule = function(moduleName, dependencies) {
        // Create angular module
        angular.module(moduleName, dependencies || []);

        // Add the module to the AngularJS configuration file
        angular.module(applicationModuleName).requires.push(moduleName);
    };

    return {
        applicationModuleName               : applicationModuleName,
        applicationModuleVendorDependencies : applicationModuleVendorDependencies,
        registerModule                      : registerModule
    };
}());

//Start by defining the main module and adding the module dependencies
angular.module(AppConfig.applicationModuleName, AppConfig.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(AppConfig.applicationModuleName).config([
    '$locationProvider',
    function($locationProvider) {
        'use strict';
        $locationProvider.hashPrefix('!');
    }
    ]).config(['$mdIconProvider', function($mdIconProvider) {
        // see: https://design.google.com/icons/
            $mdIconProvider
                .iconSet('action', '/p/lib/material-design-iconsets/iconsets/action-icons.svg', 24)
                .iconSet('alert', '/p/lib/material-design-iconsets/iconsets/alert-icons.svg', 24)
                .iconSet('av', '/p/lib/material-design-iconsets/iconsets/av-icons.svg', 24)
                .iconSet('communication', '/p/lib/material-design-iconsets/iconsets/communication-icons.svg', 24)
                .iconSet('content', '/p/lib/material-design-iconsets/iconsets/content-icons.svg', 24)
                .iconSet('device', '/p/lib/material-design-iconsets/iconsets/device-icons.svg', 24)
                .iconSet('editor', '/p/lib/material-design-iconsets/iconsets/editor-icons.svg', 24)
                .iconSet('file', '/p/lib/material-design-iconsets/iconsets/file-icons.svg', 24)
                .iconSet('hardware', '/p/lib/material-design-iconsets/iconsets/hardware-icons.svg', 24)
                .iconSet('icons', '/p/lib/material-design-iconsets/iconsets/icons-icons.svg', 24)
                .iconSet('image', '/p/lib/material-design-iconsets/iconsets/image-icons.svg', 24)
                .iconSet('maps', '/p/lib/material-design-iconsets/iconsets/maps-icons.svg', 24)
                .iconSet('navigation', '/p/lib/material-design-iconsets/iconsets/navigation-icons.svg', 24)
                .iconSet('notification', '/p/lib/material-design-iconsets/iconsets/notification-icons.svg', 24)
                .iconSet('social', '/p/lib/material-design-iconsets/iconsets/social-icons.svg', 24)
                .iconSet('toggle', '/p/lib/material-design-iconsets/iconsets/toggle-icons.svg', 24)
   }]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
    'use strict';
    //Fixing facebook bug with redirect
    if (window.location.hash === '#_=_') {
        window.location.hash = '#!';
    }

    //Then init the app
    angular.bootstrap(document, [AppConfig.applicationModuleName]);
});
