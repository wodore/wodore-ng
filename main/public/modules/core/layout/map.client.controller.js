(function() {
    'use strict';
    var module = angular.module('core');


    module.controller('BackMapController', function($scope, $mdSidenav, 
                    gaAuthentication, gaAppConfig,
                    Restangular, gaToast, $timeout, $mdMedia) {
        var tilesDict
        var layers
        
        // True if screen is greater than md
        $scope.screen_gt_md =  $mdMedia('gt-md'); 
        $scope.$watch(function() { return $mdMedia('gt-md'); }, function(gt_md) {
            $scope.screen_gt_md = gt_md;
          });

        // Tile servers
        tilesDict = {
            thunderforestOutdoors : {
              name : "Outdoors",
              url : "http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png",
              type : "xyz",
              zindex : -1,
              options : {
                attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                       }
            }, 
            thunderforestOpenCycleMap : {
              name : "Cycle",
              url : 'http://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png',
              type : "xyz",
              options : {
                attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
                }
            },
            thunderforestTransport : {
              name : "Transport",
              url : 'http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png',
              type : "xyz",
              options : {
                attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
                }
            },
            refugesHiking : {
              name : "Hiking",
              url : 'http://maps.refuges.info/hiking/{z}/{x}/{y}.png',
              type : "xyz",
              options: {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }
            },
            stamenWatercolor :{
              name : "Design",
              url: 'http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png',
              type : "xyz",
              layerOptions : {
                attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: 'abcd',
                minZoom: 1,
                maxZoom: 16
                }
            },
            osmMap :{
              name: "Basic",
              url :'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
              type : "xyz",
              options : {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              }
            },
            swissGeoAdminMap : { // update times stamp from time to time TODO
              name : "SwissTopo",
              url : 'http://wmts{s}.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/20151231/3857/{z}/{x}/{y}.jpeg',
              type : "xyz",
              layerOptions : {
                attribution: '&copy; <a href="http://www.swisstopo.admin.ch/internet/swisstopo/en/home.html">swisstopo</a>',
                subdomains: ['10','11','12','13','14'],
                timestamp : '20151231',
                minZoom: 8
                }
            }
        }

        layers = {
          baselayers: tilesDict
        }

        //$scope.showMap = true;
        angular.extend($scope, {
                center: {
                    lat: 47,
                    lng: 8.823,
                    zoom: 9
                },
                defaults: {
                    scrollWheelZoom: true
                    //zoomControl : false
                },
                //tiles: tilesDict.thunderforestTransport,
                layers: layers
            });

    });
}());
