(function() {
    'use strict';
    var module = angular.module('core');

    module.controller('wdTagChipsCtrl', function($scope,$q, Restangular,$log, $filter, wdCollections, wdTags) {
        $log.debug("Init wdTagChipsCtrl")
        $log.info("See whats in 'this'");
        $log.info(this)
        $log.info("See whats in '$scope'");
        $log.info($scope)
        var self = this;

        self.tagSuggestions = function(name){
            return wdTags.tagSuggestions(name);
        }
        
        self.someTags = []
        
        // Adds new tags from list, is used as chip transform
        self.tags = [];
        self.newTag = function(name){
            if (name.hasOwnProperty('name')) { return name }
            var tags = wdTags.get_async(name).then(function(tags){
                for (var i = 0; i < tags.length; i++) { 
                    if (_.indexOf(self.tags,tags[i]) == -1){
                        self.tags.push(tags[i]);
                    }
                }
            });
            return null
        }

        // Load more tags
        self.nextCursor = ""
        self.moreTags = true
        self.moreTagsLoading = false
        self.getSomeTags = function(){
            self.moreTagsLoading = true
            Restangular.all('tags').getList({count_greater:-1,size:10,cursor:self.nextCursor})
            .then(function(tags) {
                self.someTags = self.someTags.concat(tags)
                self.nextCursor = tags.meta.nextCursor
                self.moreTags = tags.meta.more
                self.moreTagsLoading = false
                });
        }

        self.getSomeTags();

        self.addTags = function(){
            wdTags.add_async(self.tags)

        }

        
    });
}());
