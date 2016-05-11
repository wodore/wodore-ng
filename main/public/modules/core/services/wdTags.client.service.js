(function() {
    'use strict';
    var module = angular.module('core');

    /**
     * @name wdTags
     * @memberOf angularModule.core
     * @description
     * Loads and updates tags
     */

    module.service('wdTags', function(Restangular,$log,
                $q, wdCollections) {

        var self = this;

        /*****************************************************************
         * loading is true if something is loading
         */
        this.loading = false;

        /*****************************************************************
         * Saves all tags:
         * tags.collection_key.tag_name = tag_detail
         */
        this.tags = {} 

        /*****************************************************************
         * Load async 'tags' from the server.
         * If tag is already available offline it is updated with the server
         * version
         *
         * Parameters:
         * - tags        : a list or comma separated string with tags
         * - collection  : collection urlsafe key, default is the seleceted
         *                 collection
         *
         * Returns:
         * - tag_list    : a array with tags: ['tag1','tag2',...] (as promise)
         */
        this.load = function(tags,collection) {
            $log.debug("[load] ---------------- ")
            self = this;
            tags = typeof tags !== 'undefined' ? self.check_tag_list(tags) : [];
            collection = typeof collection !== 'undefined' ? collection : wdCollections.get_collection().key;

            $log.debug("[load] Going to load the following tags from server:")
            $log.debug(tags)

            if (tags.length === 0){
                    deferred.reject("No tags given");
            }

            var deferred = $q.defer();
            self.loading = true;
            var tags_array = []
            Restangular.one('tags',collection).all(tags.join()).getList()
                .then(function(tags) {
                    $log.debug("[load] Got tags from server:")
                    $log.debug(tags)
                    for (var i = 0; i < tags.length; i++) { 
                        var tag = tags[i];
                        tags_array.push(tag)
                        if ( ! self.tags.hasOwnProperty(collection)){
                            self.tags[collection] = {};
                        }
                        self.tags[collection][tag.name] = tag
                    }
                    self.loading = false;
                }).then(function(){
                    $log.debug("[load] RESOLVE")
                    deferred.resolve(tags_array);
                });
            return deferred.promise;
        }

        /*****************************************************************
         * Returns a list with tag names.
         * The tag names are "lowered" and "trimed". (if shorther than 4)
         *
         * Parameters:
         * - tags        : a list or comma separated string with tags
         *                   tags = ['tag1','tag2',...] or "tag1,tag2,..."
         *                   tags = "tag1"
         *
         * Returns:
         * - tag_list    : a array with tags: ['tag1','tag2',...]
         */
        this.check_tag_list = function(tags){
            $log.debug("[check_tag_list] ---------------- ")
            // create array if is is a string
            if (_.isString(tags)){
                tags = tags.split(',');
            }
            // trim and lower tag name
            var tag_list = [];
            for (var i = 0; i < tags.length; i++) { 
                var tag = tags[i]
                if ( tag.length > 4 ){
                    tag = tag.toLowerCase();
                }
                tag = _.trim(tag); 
                tag_list.push(tag);
            }
            return tag_list
        }

        /*****************************************************************
         * Returns a promies which resolves tag details for the given tags.
         * If a tag is not already available offline it gets it from the
         * server.
         *
         * Parameters:
         * - tags        : a list or comma separated string with tags
         * - collection  : collection urlsafe key, default is the seleceted
         *                 collection
         *
         * Returns:
         * - tag_details : a list with tag details: 
         *                     [{name:"tag1",icon_url:"..."},{...},...]
         */
        this.get_async = function(tags,collection){
            $log.debug("[get_async] ---------------- ")
            self = this;
            tags = typeof tags !== 'undefined' ? self.check_tag_list(tags) : [];
            var deferred = $q.defer();
            var tag_details = []
            var tags_to_load = []
            var tags_to_load_i = []
            collection = typeof collection !== 'undefined' ? collection : wdCollections.get_collection().key;
            $log.debug("[get_async] Collection key: "+collection)
            if (self.tags.hasOwnProperty(collection)){
                for (var i = 0; i < tags.length; i++) { 
                    var tag = tags[i]
                    if (self.tags[collection].hasOwnProperty(tag)){
                        tag_details[i] = self.tags[collection][tag]
                    } else{
                        $log.debug("[get_async] Not downloaded yet: "+tag+" ("+i+")")
                        if (tag){
                            tags_to_load.push(tag);
                            tags_to_load_i.push(i);
                        } else {
                            tag_details[i] = ""
                        }
                    }
                }
                if (tags_to_load.length > 0 ){
                    self.load(tags_to_load,collection).then(function(tags){
                        for (var i = 0; i < tags.length; i++) { 
                            tag_details[tags_to_load_i[i]] = tags[i]; 
                        }
                        $log.debug("[get_async] RESOLVE 1")
                        deferred.resolve(tag_details);
                    });
                } else {
                    $log.debug("[get_async] RESOLVE 2")
                    deferred.resolve(tag_details);
                }
            } else {
                if (tags.length > 0 ){
                    self.load(tags,collection).then(function(tags){
                        $log.debug("[get_async] RESOLVE 3")
                        deferred.resolve(tags);
                    });
                }
            }
            return deferred.promise;
        }

        /*****************************************************************
         * Returns a list of tag details for a given query.
         * The function can be used for autocomplete.
         * It is automatically only every 800ms executed (throttled).
         * 
         * Parameters:
         * - query       : partial tag name
         * - size        : max size of returned array
         *
         * Returns:
         * - tag_details : a list with tag details: 
         *                     [{name:"tag1",icon_url:"..."},{...},...]
         */
        this.tagSuggestions = _.throttle(function(query,size) {
            size = typeof size !== 'undefined' ? size : 20;
            return $q(function(resolve, reject) {
                 Restangular.one('tags',wdCollections.get_collection())
                    .all('suggestions')
                    .all(query)
                    .getList({size:size,only_names:true})
                    .then(function(tags){
                            var tag_details = self.get_async(tags);
                            resolve(tag_details);
                    });
            });
        }, 800,{trailing: true, leading:true}); 


        /*****************************************************************
         * Returns a list with tags already stored offline.
         * The function does not get new tags, for this
         * you should user get_async!
         * 
         * Parameters:
         * - tags        : a list or comma separated string with tags
         * - collection  : collection urlsafe key, default is the seleceted
         *                 collection
         *
         * Returns:
         * - tag_details : a list with tag details: 
         *                     [{name:"tag1",icon_url:"..."},{...},...]
         */
        this.get = function(tags,collection) {
            $log.debug("[get] ---------------- ")
            tags = typeof tags !== 'undefined' ? self.check_tag_list(tags) : [];
            collection = typeof collection !== 'undefined' ? collection : wdCollections.get_collection().key;
            self = this;
            var tag_details = []
            if (self.tags.hasOwnProperty(collection)){
                for (var i = 0; i < tags.length; i++) { 
                    var tag = tags[i]
                    if (self.tags[collection].hasOwnProperty(tag)){
                        tag_details[i] = self.tags[collection][tag]
                    } else {
                        tag_details[i] = null
                    }
                }
            }
            return tag_details 
        }

        /*****************************************************************
         * TODO not tested yet, not sure if it is used!
         * TODO same goes for the tag_api side
         * Returns a list with tags already stored offline.
         * The function does not get new tags, for this
         * you should user get_async!
         * 
         * Parameters:
         * - tags        : a list or comma separated string with tags
         * - collection  : collection urlsafe key, default is the seleceted
         *                 collection
         *
         * Returns:
         * - tag_details : a list with tag details: 
         *                     [{name:"tag1",icon_url:"..."},{...},...]
         */
        this.add_async = function(tag_details,collection) {
            $log.debug("[add_async] ---------------- ")
            tag_details = typeof tag_details !== 'undefined' ? tag_details : [];
            collection = typeof collection !== 'undefined' ? collection : wdCollections.get_collection().key;
            self = this;
            Restangular.one('tags',collection)
                .customPUT({collection:collection, tag_details:tag_details})
                .then(function(tags){
                    $log.debug("[add_async] answer: ")
                    $log.debug(tags)
                });
            return tag_details 
        }
    });

}());
