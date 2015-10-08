(function() {
    'use strict';
    var module = angular.module('core');


    module.controller('BackMapController', function($scope, $mdSidenav, 
                    gaAuthentication, gaAppConfig,
                    Restangular, gaToast, $timeout, $mdMedia, $mdDialog) {
        var tilesDict
        var layers
        
        // True if screen is greater than md
        $scope.screen_gt_md =  $mdMedia('gt-md'); 
        $scope.$watch(function() { return $mdMedia('gt-md'); }, function(gt_md) {
            $scope.screen_gt_md = gt_md;
          });

        // Tile servers
        if (false) { // if true --> ONLINE
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
        } else {
        tilesDict = {
            OfflineMapQuest :{
              name: "O-MQ",
              url :'p/tileServer/MapQuest/{z}/{x}/{y}.jpg',
              type : "xyz",
              options : {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		        minZoom: 0,
                maxZoom: 16,
              }
            },
            Offline4uMaps :{
              name: "O-4uM",
              url :'p/tileServer/4uMaps/{z}/{x}/{y}.png',
              type : "xyz",
              options : {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		        minZoom: 2,
                maxZoom: 15,
              }
            },
            OfflineHike :{
              name: "O-Hike",
              url :'p/tileServer/Hike/{z}/{x}/{y}.png',
              type : "xyz",
              options : {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		        minZoom: 0,
                maxZoom: 15,
              }
            },
            OfflinePublic :{
              name: "O-Public",
              url :'p/tileServer/Public/{z}/{x}/{y}.png',
              type : "xyz",
              options : {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		        minZoom: 2,
                maxZoom: 16,
              }
            }
          }
        }

        layers = {
          baselayers: tilesDict
        }

        //$scope.showMap = true;
        angular.extend($scope, {
                center: {
                    lat: 46.85,
                    lng: 10.5,
                    zoom: 9
                },
                defaults: {
                    scrollWheelZoom: true
                    //zoomControl : false
                },
                //tiles: tilesDict.OfflineHike,
                layers: layers
            });

        $scope.markers = new Array();

        $scope.$on("leafletDirectiveMap.click", function(event, args){
            var leafEvent = args.leafletEvent;
            var marker_zoom
            if ( $scope.center.zoom < 15) {
              marker_zoom = 15
            } else {
              marker_zoom = $scope.center.zoom
            }
            $scope.marker_center =  {
                    lat: leafEvent.latlng.lat,
                    lng: leafEvent.latlng.lng,
                    zoom: marker_zoom 
                };
	   //$scope.tiles = tilesDict.OfflinePublic;
           // $scope.markers.push({
           //     lat: leafEvent.latlng.lat,
           //     lng: leafEvent.latlng.lng,
           //     message: "My Added Marker"
           // });
            $scope.marker_new = [{
                lat: leafEvent.latlng.lat,
                lng: leafEvent.latlng.lng,
                draggable: true,
            }];
            // fix because marker is not update (bug)
            // https://github.com/tombatossals/angular-leaflet-directive/issues/685
            $scope.$on('leafletDirectiveMarker.dragend', function (e, args) {
             $scope.marker_new[0].lng = args.model.lng;
             $scope.marker_new[0].lat = args.model.lat;
            });

            $mdDialog.show({
              controller: DialogController,
              templateUrl: '/p/modules/core/layout/add_marker.client.view.template.html',
              parent: angular.element(document.body),
              targetEvent: event,
              scope : $scope,
              preserveScope: true
            })
        });

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




    });
}());
