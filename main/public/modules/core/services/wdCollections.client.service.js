(function() {
    'use strict';
    var module = angular.module('core');

    /**
     * @name wdCollections
     * @memberOf angularModule.core
     * @description
     * Loads, updates and filters collections
     */

    module.service('wdCollections', function(Restangular,$log,
                $q, gaAuthentication) {

        var self = this;
        this.more = {};
        this.loading = false;
        this.total = 0;
        this.listByKey = {};
        this.indexToId = [];

        var nextCursor = {}

        var username = gaAuthentication.user.username;
        
        // Load more data
        // It returns a promise:
        // wdCollections.load(15).then(successFn(newCols),errorFn(msg))
        this.load = function(size,filter,filterName) {
            // filter = {private: true, active: true, ...}
            // The filtername is needed to save different cursors (depending on the filter)
            // The same name should only be used for the same filters
            size = typeof size !== 'undefined' ? size : 20;
            filter = typeof filter !== 'undefined' ? filter : {};
            filterName = typeof filterName !== 'undefined' ? filterName : "default";
            $log.debug("Try to load new collections")
            var deferred = $q.defer();

            // only load new collections if more are available
            if(self.more.hasOwnProperty(filterName)){
                $log.info("More has a property "+filterName)
                if (!self.more[filterName]) {
                    $log.warn("No more collections available from server")
                    deferred.reject('No more new values');
                }
            } 
            if (self.loading) {
                $log.warn("It is already loading new collections")
                deferred.reject('Already loading');
            } else {
                self.loading = true;
                if(!nextCursor.hasOwnProperty(filterName)){
                    nextCursor[filterName] = "";
                }
                $log.debug("Load "+size+" new collections")
                $log.debug("Use cursor: "+nextCursor[filterName])
                var args = _.extend(
                        {cursor: nextCursor[filterName], 
                         size: size }, filter)
                $log.info(args);
                var collections_api = Restangular.one('users',username).all('collections')
                $log.error(collections_api);
                collections_api.getList(args)
                //Restangular.all('collections/'+username).getList(args)
                //Restangular.one('collections',username).getList()
                    .then(function(collections) {
                        $log.error(collections)
                        var oldCursor = nextCursor[filterName];
                        nextCursor[filterName] = collections.meta.nextCursor;
                        self.more[filterName] = collections.meta.more;
                        self.total = collections.meta.totalCount;
                        for (var i = 0; i < collections.length; i++) { 
                            var col = collections[i];

                            // user Collection key and not CollectionUser
                            if(col.hasOwnProperty('collection')){
                                col.key = col.collection
                            } else {
                                col.collection = col.key
                            }
                            if(!col.hasOwnProperty('self')){
                                col.self = {link: '/api/v1/collections/'+col.key}
                            }

                            // TODO wrong, needs to find col.key in props
                            // and the update it if it exits.
                            var indexExists = _.findIndex(self.indexToId, ['key', col.key]);
                            if(indexExists > -1){
                                $log.warn("Collection already exists -> update");
                                self.indexToId[indexExists] = {key : col.key,
                                                  private : col.private,
                                                  active: col.active,
                                                  public : col.public,
                                                  created : col.created,
                                                  modified : col.modified
                                                };
                            } else {
                                self.indexToId = self.indexToId.concat(
                                    { key : col.key,
                                      private : col.private,
                                      active: col.active,
                                      public : col.public,
                                      created : col.created,
                                      modified : col.modified
                                    });
                            }
                            self.listByKey[col.key] = col;
                            self.listByKey[col.key]['nr'] = self.loadedLen() + 1;
                            self.listByKey[col.key]['avatar'] = "https://robohash.org/"+col.key+"?set=set1&bgset=bg2&size=150x150"
                        }
                        if ( oldCursor === nextCursor[filterName] ){
                            $log.warn("Same cursor, data is updated")
                            //deferred.reject('Double load');
                        }
                        self.loading = false;
                        deferred.resolve(collections);
                    });
            }
            return deferred.promise;
        };

        this.loadedLen = function(filter) {
            filter = typeof filter !== 'undefined' ? filter : false;
            if ( filter !== false ) {
                return _.size(self.get_list(false,false,'desc',filter));
            }
            //$log.info(self.listByKey);
            return _.size(self.listByKey);
        }

        this.totalLen = function() {
            return self.total;
        }

        this.more = function(filterName) {
            filterName = typeof filterName !== 'undefined' ? filterName : "default";
            if(self.more.hasOwnProperty(filterName)){
                return self.more[filterName];
            } else {
                return true
            }
        }

        this.get = function(obj) {
            // obj = {index or i : nr, key : str, load : false,
            // sort = ['prop','prop2'], 
            // order = ['desc','desc'] (default: desc)
            // filter = ['name','prop'] (default: false)
            if(obj.hasOwnProperty("index")){
                obj.i = obj.index;
            }
            if(!obj.hasOwnProperty("sort")){
                obj.sort = 'modified';
                obj.order = 'desc';
            }
            if(!obj.hasOwnProperty("filter")){
                obj.filter = false;
            }
            if(obj.hasOwnProperty("i")){
                if ( obj.sort !== false || obj.filter !== false){
                    var list = self.get_list(false,obj.sort,obj.order,obj.filter)
                    if(list.hasOwnProperty(obj.i)){
                        return list[obj.i]
                    } else {
                        return null
                    }
                } else {
                    if(self.indexToId.hasOwnProperty(obj.i)){
                        var key = self.indexToId[obj.i].key
                        if(self.listByKey.hasOwnProperty(key)){
                            return self.listByKey[key];
                        }
                    }
                    return null
                }
            } else if(obj.hasOwnProperty("key")){
                if(self.listByKey.hasOwnProperty(obj.key)){
                    return self.listByKey[obj.key];
                } else {
                    return null
                }
            }
            return null
        }
        this.get_async = function(obj) {
            // obj = {index or i : nr, key : str, load : false,
            // sort = ['prop','prop2'], 
            // order = ['desc','desc'] (default: desc)
            // filter = ['name','prop'] (default: false)
            // force = true/false* > reloads from server anyway
            if(!obj.hasOwnProperty("force")){
                obj.force = false;
            }
            var deferred = $q.defer();
            var get = self.get(obj);
            if ( obj.force === true ) {
                if(get !== null){
                    $log.warn("Add key to get_async")
                    obj.key = get.key
                }
            }
            if(obj.hasOwnProperty("key")){
                if(get === null || obj.force === true){
                    Restangular.one('collections',obj.key).get()
                    .then(function(collection) {
                        if(!collection.hasOwnProperty('self')){
                            collection.self = {link: '/api/v1/collections/'+collection.key}
                        }
                        if(! collection.hasOwnProperty('collection')){
                            collection.collection = obj.key;
                        }
                        collection.avatar = "https://robohash.org/"+obj.key+"?set=set1&bgset=bg2&size=150x150"

                        self.listByKey[obj.key] = collection;
                        deferred.resolve(collection);
                    });
                } else {
                        deferred.resolve(get);
                }
            } else {
                deferred.resolve(get);
            }
            return deferred.promise;
        }


        this.get_list = function(byId,sort,order,filter) {
            byId = typeof byId !== 'undefined' ? byId : false;
            sort = typeof sort !== 'undefined' ? sort : 'modified';
            order = typeof order !== 'undefined' ? order : "desc"; // or "asc"
            filter = typeof filter !== 'undefined' ? filter : false;
            if ( sort !== false ){
                var list =  _.orderBy(self.listByKey, sort, order);
                $log.debug("ORDER LIST")
                $log.debug(sort)
                $log.debug(order)
                byId = false;
            }
            if(byId && sort !== false){
                var list =  self.listByKey;
            } else {
                // create index list
                var list = []
                for (var key in self.listByKey){
                        list.push(self.listByKey[key])
                    }
            }
            if ( filter !== false ){
                var list = _.filter(list,filter);
            }
            return list;
        }

        this.permission_to_number = {'none' : 0,
                    'read' : 1,
                    'write' : 2,
                    'admin' : 3,
                    'creator' : 5}

        this.number_to_permission = {0: 'none',
                    1: 'read',
                    2: 'write',
                    3: 'admin',
                    5: 'creator'}

        this.permission_to_icon = {'none' : 'notification:do_not_disturb',
                    'read' : "image:remove_red_eye",
                    'write' : 'editor:mode_edit',
                    'admin' : 'action:settings_applications',
                    'creator' : 'action:perm_identity'}

        this.permission_to_icon_simple = {'none' : 'notification:do_not_disturb',
                    'read' : "image:remove_red_eye",
                    'write' : 'editor:mode_edit',
                    'admin' : 'editor:mode_edit',
                    'creator' : 'editor:mode_edit' }

    });

}());
