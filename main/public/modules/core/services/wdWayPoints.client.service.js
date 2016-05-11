(function() {
    'use strict';
    var module = angular.module('core');

    /**
     * @name wdWayPoints
     * @memberOf angularModule.core
     * @description
     * Loads and updates waypoints
     */

    module.service('wdWayPoints', function(Restangular,$log,
                $q,$timeout ) {

        var self = this;

        /*****************************************************************
         * loading is true if something is loading
         */
        this.loading = false;

        /*****************************************************************
         * Saves all waypoints: [CACHE]
         * waypoints.collection_key.data = {id1:waypoint1, id2: ...]
         *                         .meta = {nextCursor, more, and so on}
         */
        this.waypoints = {} 

        /*****************************************************************
         * Waypoint available (and possible displayed) to the user
         * current_waypoints = {id1: waypoint1, id2: ...}
         */
        this.current_waypoints = {} 
        this.current_collections = ""

        /*****************************************************************
         * Save the timestamp when it was last updated
         */
        this.timestamp = {}

        // TODO make service! 
        /*****************************************************************
         * Load new waypoints every 5 seconds as long the user is active
         */
        $timeout(function(){
            $log.info("[ifvisible] Start loading");
        ifvisible.onEvery(10.0, function(){
            // Do an animation on the logo only when page is visible
            $log.info("[ifvisible] Load newest data");
            $log.info("[ifvisible] timestamp: "+self.timestamp[self.current_collections]);
            $log.info("[ifvisible] collection: "+self.current_collections);
            self.load(self.current_collections,{newer:self.timestamp[self.current_collections],
                                                offset:-40});

        });
        },20000)


        /*****************************************************************
         * Load async 'waypoints' from the server.
         * If a waypoint is already available offline it is updated with the server
         * version
         *
         * Parameters:
         * - collection  : collection urlsafe key, default is the seleceted
         *                 collection
         * - options     : {}
         *     page_size : how much to load per page (default:20)
         *     pages     : how many pages to load (default:500 -> 10'000 waypoints)
         *     newer     : date string, if given only newer waypoints are loaded (Y-m-d H:M:S)
         *
         * Returns:
         * - more        : true if more data is available (as promise)
         */
        this.load = function(collection,options) {
            $log.debug("[load] ---------------- ")
            self = this;
            collection = typeof collection !== 'undefined' ? collection : self.current_collections;
            self.current_collections = collection;
            options = typeof options !== 'undefined' ? options : {};
            _.defaults(options,{page_size:20,
                                pages:500,
                                newer:null,
                                offset:null})

            var page_size = options.page_size;
            var pages = options.pages ;
            var newer = options.newer;
            var offset = options.offset;
            var TS = new Date().toJSON();
            self.timestamp[collection] = TS.slice(0,10)+" "+TS.slice(11,19);


            $log.debug("[load] Going to load waypoints from server:")
            $log.warn(collection)
            var deferred = $q.defer();
            self.loading = true;
            if (!self.waypoints.hasOwnProperty(collection)){
                self.waypoints[collection] = {}
                self.waypoints[collection]['meta'+newer] = {nextCursor:null,more:true}
                self.waypoints[collection]['data'] = {}
            } else if (!self.waypoints[collection].hasOwnProperty('meta'+newer)){
                self.waypoints[collection]['meta'+newer] = {nextCursor:null,more:true}
            }
            Restangular.all('waypoints').all(collection)
                .getList(
                    {size:page_size,noTotal:true,
                    cursor : self.waypoints[collection]['meta'+newer].nextCursor,
                    newer:newer, offset:offset}
                )
                .then(function(wps) {
                    $log.debug("[load] Got waypoints from server:")
                    self.waypoints[collection]['meta'+newer] = wps.meta
                    $log.debug(wps.meta)
                    if (pages > 1 && wps['meta'].more){
                        self.load(collection,{page_size:page_size,pages:pages-1,
                                    newer:newer,offset:offset}).then(function(){
                            $log.debug("[load] RESOLVE")
                            $log.info(self.waypoints);
                            deferred.resolve(self.waypoints[collection]['meta'+newer].more);
                        });
                    } else {
                        deferred.resolve(self.waypoints[collection]['meta'+newer].more);
                    }
                    for (var i = 0; i < wps.length; i++) { 
                        var wp = wps[i]
                        self.waypoints[collection]['data'][wp.id] = wp
                        self.waypoints[collection]['data'][wp.id]['message'] = "<h4>"+wp.name+"</h4><p>"+wp.tags+"</p>"
                        self.waypoints[collection]['data'][wp.id]['group'] = "markercluster"
                    }
                });
            return deferred.promise;
        }


        /*****************************************************************
         * TODO collections as list
         * set the current waypoints, collections is either a list of
         * collections or just one collection.
         * Default is the current selected collection
         *
         * This function does not load the waypoints! 
         * Use load() for this.
         *
         * Parameters:
         * - collections : a list or string (keys)
         *
         * Returns:
         * - ref to current waypoints
         */
        this.set_current_waypoints = function(collections){
            collection = typeof collection !== 'undefined' ? collection : self.current_collections;
            var collection = collections // TODO for loop
            if (!self.waypoints.hasOwnProperty(collection)){
                self.waypoints[collection] = {}
                self.waypoints[collection]['meta'+null] = {nextCursor:null,more:true}
                self.waypoints[collection]['data'] = {}
            }
            self.current_waypoints = self.waypoints[collections]['data'];
            return self.current_waypoints;
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
            collection = typeof collection !== 'undefined' ? collection : self.current_collections;
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
                 Restangular.one('tags',self.current_collections)
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
            //collection = typeof collection !== 'undefined' ? collection : wdCollections.get_collection().key;
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
        this.add_async = function(collection,waypoint) {
            $log.debug("[add_async] ---------------- ")
            collection = typeof collection !== 'undefined' ? collection : self.current_collections;
            var wp = typeof waypoint !== 'undefined' ? waypoint : {};
            //collection = typeof collection !== 'undefined' ? collection : wdCollections.get_collection().key;
            self = this;


            self.waypoints[collection]['data']['temp'] = wp;

            Restangular.one('waypoints',collection)
                .customPUT({collection:collection, 
                            key : null,
                            name:wp.name,
                            description:wp.description,
                            urls:wp.urls,
                            tags: wp.tags,
                            geo :wp.geo
                            })
                .then(function(answer){
                    self.waypoints[collection]['data'][answer.id] = wp;
                    self.waypoints[collection]['data'][answer.id]['message'] = "<h4>"+wp.name+"</h4><p>"+wp.tags+"</p>";
                    self.waypoints[collection]['data'][answer.id]['group'] = "markercluster";
                    delete self.waypoints[collection]['data']['temp'];
                })
                .then(function(msg){
                    $log.error("[Load waypoints]: "+msg)
                    delete self.waypoints[collection]['data']['temp'];
                });
        }
    });

}());
