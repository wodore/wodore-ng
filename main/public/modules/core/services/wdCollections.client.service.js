(function() {
    'use strict';
    var module = angular.module('core');

    /**
     * @name wdCollections
     * @memberOf angularModule.core
     * @description
     * Loads, updates and filters collections
     */

    module.service('wdCollections', function(Restangular,$log,$q) {

        var self = this;
        this.more = {};
        this.loading = false;
        this.total = 0;
        this.listById = {};
        this.indexToId = [];

        var nextCursor = {}
        
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
                         size: size, }, filter)
                $log.info(args);
                Restangular.all('collections').getList(args)
                    .then(function(collections) {
                        var oldCursor = nextCursor[filterName];
                        nextCursor[filterName] = collections.meta.nextCursor;
                        self.more[filterName] = collections.meta.more;
                        self.total = collections.meta.totalCount;
                        for (var i = 0; i < collections.length; i++) { 
                            var col = collections[i];
                            // TODO wrong, needs to find col.id in props
                            // and the update it if it exits.
                            var indexExists = _.findIndex(self.indexToId, ['id', col.id]);
                            if(indexExists > -1){
                                $log.warn("Collection already exists -> update");
                                self.indexToId[indexExists] = {id : col.id,
                                                  private : col.private,
                                                  active: col.active,
                                                  public : col.public,
                                                  created : col.created,
                                                  modified : col.modified
                                                };
                            } else {
                                self.indexToId = self.indexToId.concat(
                                    { id : col.id,
                                      private : col.private,
                                      active: col.active,
                                      public : col.public,
                                      created : col.created,
                                      modified : col.modified
                                    });
                            }
                            self.listById[col.id] = col;
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

        this.loadedLen = function() {
            return self.listById.length;
        }

        this.totalLen = function() {
            return self.total;
        }

        this.get = function(obj) {
            // obj = {index or i : nr, id : str, load : false,
            // sort = ['prop','prop2'], 
            // order = ['desc','desc'] (default: desc)}
            if(obj.hasOwnProperty("index")){
                obj.i = obj.index;
            }
            if(!obj.hasOwnProperty("sort")){
                obj.sort = false;
                obj.order = false;
            }
            if(obj.hasOwnProperty("i")){
                if ( obj.sort ){
                    return self.get_list(false,obj.sort,obj.order)[obj.i]
                } else {
                    return self.listById[self.indexToId[obj.i].id];
                }
            } else if(obj.hasOwnProperty("id")){
                return self.listById[obj.id];
            }
        }

        this.get_list = function(byId,sort,order) {
            byId = typeof byId !== 'undefined' ? byId : false;
            sort = typeof sort !== 'undefined' ? sort : false;
            order = typeof order !== 'undefined' ? order : "desc"; // or "asc"
            if ( sort !== false ){
                return _.orderBy(self.listById, sort, order);
            }
            if(byId){
                return self.listById;
            } else {
                // create index list
                var list = []
                for (var id in self.listById){
                        list.push(self.listById[id])
                    }
                return list;
            }
        }

    });

}());
