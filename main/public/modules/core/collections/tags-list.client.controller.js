(function() {
    'use strict';
    var module = angular.module('core');

    module.controller('TagsController', function($scope,$q, Restangular,$log, $filter, wdCollections, wdTags) {
        $log.debug("Init TagsListController")
        var self = this;

        $scope.tagSuggestions = function(name){
            return wdTags.tagSuggestions(name);
        }
        
        $scope.someTags = []
        
        // Adds new tags from list, is used as chip transform
        $scope.inputTags = [];
        $scope.newTag = function(name){
            if (name.hasOwnProperty('name')) { return name }
            var tags = wdTags.get_async(name).then(function(tags){
                for (var i = 0; i < tags.length; i++) { 
                    if (_.indexOf($scope.inputTags,tags[i]) == -1){
                        $scope.inputTags.push(tags[i]);
                    }
                }
            });
            return null
        }

        // Load more tags
        $scope.nextCursor = ""
        $scope.moreTags = true
        $scope.moreTagsLoading = false
        $scope.getSomeTags = function(){
            $scope.moreTagsLoading = true
            Restangular.all('tags').getList({count_greater:-1,size:10,cursor:$scope.nextCursor})
            .then(function(tags) {
                $scope.someTags = $scope.someTags.concat(tags)
                $scope.nextCursor = tags.meta.nextCursor
                $scope.moreTags = tags.meta.more
                $scope.moreTagsLoading = false
                });
        }

        $scope.addTags = function(){
            wdTags.add_async($scope.inputTags)

        }

        
    });
}());
