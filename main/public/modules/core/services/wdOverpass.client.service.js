(function() {
    'use strict';
    var module = angular.module('map');

    /**
     * @name wdTags
     * @memberOf angularModule.core
     * @description
     * Loads and updates tags
     */

    module.service('wdOverpass', function(Restangular,$log,
            $q, $http ) {

                var self = this;

                /*****************************************************************
                 * loading is true if something is loading
                 */
                this.loading = false;

                var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

                /*****************************************************************
                * Function which returns a overpass query
                * options = { values : [ ['"natural"="peak"', 'n']
                *               ['"public_transport"', 'nw']
                *               ['"tourism"', 'nw']
                *               ... ],
                *             radius : 80}
                *
                * Returns a function which can be used to query overpass calls.
                * The function needs the coordinates as argument:
                *   get_info = overpass_query({radius:20})
                *   res = get_info("47.4,9.0")
                *   ...
                */

                this.overpass_query = function(options) {
                    var clean_tags, dist;
                    clean_tags = function(ar) {
                        var i, key, ref, res, results, value;
                        if (ar.length === 0) {
                            return [];
                        }
                        res = {};
                        for (key = i = 0, ref = ar.length - 1; 0 <= ref ? i <= ref : i >= ref; key = 0 <= ref ? ++i : --i) {
                            res[ar[key]] = ar[key];
                        }
                        results = [];
                        for (key in res) {
                            value = res[key];
                            results.push(value.split('_').join(' '));
                        }
                        return results;
                    };
                    dist = function(lon_from, lat_from, lon_to, lat_to) {
                        var dx, dy, phi, phi_base, theta, theta_base;
                        if (!((lat_to != null) && (lon_to != null))) {
                            return 10000;
                        }
                        phi_base = lat_from * 0.01745329251;
                        theta_base = lon_from * 0.01745329251;
                        phi = lat_to * 0.01745329251;
                        theta = lon_to * 0.01745329251;
                        dx = Math.cos(phi_base) * (theta - theta_base);
                        dy = phi - phi_base;
                        return Math.sqrt(dx * dx + dy * dy);
                    };
                    if (options == null) {
                        options = {};
                    }
                    if ((options != null ? options.radius : void 0) == null) {
                        options.radius = 80;
                    }
                    if ((options != null ? options.values : void 0) == null) {
//['natural=peak', 'name', 'n'], ['natural=saddle', 'name', 'n'],['natural=water', 'name', 'nw'], ['natural=glacier', 'name', 'nw']
                        options.values = [['natural', 'name', 'nw'],['place=locality', 'name', 'n'], ['public_transport', 'name', 'nw'], ['railway~"bus_stop|tram_stop|station|halt"', 'name', 'nw'], ['highway~"bus_stop|platform"', 'name', 'nw'], ['aerialway=station', 'name', 'n'], ['aerialway~"gondola|chair_lift|cable_car"', 'name', 'nw'], ['tourism', 'name', 'nw'], ['bus=yes', 'name', 'n'], ['train=yes', 'name', 'n'], ['amenity=restaurant', 'name', 'nw'], ['amenity=bicycle_parking', 'nw'], ['amenity=bicycle_rental', 'nw'], ['amenity=car_rental', 'nw'], ['amenity=ferry_terminal', 'nw'], ['amenity=fuel', 'nw'], ['amenity=parking', 'nw'], ['amenity=clinic', 'nw'], ['amenity=hospital', 'nw'], ['amenity=pharmacy', 'nw'], ['amenity=cinema', 'nw'], ['amenity=theatre', 'nw'], ['amenity=grave_yard', 'nw'], ['amenity=police', 'nw'], ['amenity=shelter', 'nw'], ['amenity=toilets', 'nw'], ['amenity=water_point', 'nw'], ['sport', 'name', 'nw']];
                    }
                    return function(latlng, callback) {
                        var i, j, len, len1, out, overpass_api, qry, r, ref, ref1, t, tests, val;
                        if (latlng == null) {
                            $log.debug("[ERROR] No coordinates are given ('latlng')");
                        }
                        out = {};
                        overpass_api = "http://overpass.osm.rambler.ru/cgi/interpreter";
                        overpass_api = "http://overpass-api.de/api/interpreter";
                        overpass_api = "http://overpass.osm.ch/api/interpreter"; // ONLY CH, but faster
                        r = options.radius;
                        qry = '[out:json];(';
                                ref = options.values;
                                for (i = 0, len = ref.length; i < len; i++) {
                                    val = ref[i];
                                    tests = "";
                                    ref1 = val.slice(0, -1);
                                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                                        t = ref1[j];
                                        tests += "[" + t + "]";
                                    }
                                    if (indexOf.call(val.slice(-1)[0], 'n') >= 0) {
                                        qry += "node" + tests + "(around:" + r + "," + latlng + ");";
                                    }
                                    if (indexOf.call(val.slice(-1)[0], 'w') >= 0) {
                                        qry += "way" + tests + "(around:" + r + "," + latlng + ");";
                                    }
                                    if (indexOf.call(val.slice(-1)[0], 'r') >= 0) {
                                        qry += "rel" + tests + "(around:" + r + "," + latlng + ");";
                                    }
                                }
                                qry += ');out body qt 40;';
                        var qryAll = '[out:json];(';
                        qryAll += "node[name](around:" + r + "," + latlng + ");";
                        qryAll += "way[name](around:" + r + "," + latlng + ");";
                        qryAll += "/*rel[name](around:" + r + "," + latlng + ");*/";
                        //qryAll += ');out body qt 40;';
                        qryAll += ');out center meta qt 40;';
                        //$log.debug("Query is:")
                        //$log.debug(qry);
                        qry = encodeURIComponent(qry);
                        qryAll = encodeURIComponent(qryAll);
                        //$log.debug(qry);
                        //$.getJSON(overpass_api, "data=" + qry, function(data) {
                        $http.get(overpass_api +"?data=" + qry).then(function(rawData) {
                            var elements, k, key, lat, latlngArray, len2, lng, n, name, ref2, tags, value, wiki;
                            $log.debug("Results from the overpass api call:");
                            var data = rawData.data
                            $log.debug(data);
                            $log.debug(data.elements);
                            latlngArray = latlng.split(',');
                            lat = Number(latlngArray[0]);
                            lng = Number(latlngArray[1]);
                            elements = data.elements;
                            for (var i = 0; i < elements.length; i++){
                                if (elements[i].hasOwnProperty('center') ){
                                    elements[i].lat = elements[i].center.lat;
                                    elements[i].lon = elements[i].center.lon;
                                }
                            }
                            elements.sort(function(a, b) {
                                return dist(lng, lat, Number(a.lon), Number(a.lat)) - dist(lng, lat, Number(b.lon), Number(b.lat));
                            });
                            $log.debug("Elements after sorting");
                            $log.debug(elements);
                            if (elements[0] != null) {
                                for (k = 0, len2 = elements.length; k < len2; k++) {
                                    n = elements[k];
                                    if (n.tags.uic_name) {
                                        name = n.tags.uic_name;
                                        break;
                                    } else if (n.tags.name) {
                                        name = n.tags.name;
                                        break;
                                    } else {
                                        name = "";
                                    }
                                }
                                out.name = name;
                                if (elements[0].tags.website != null) {
                                    out.url = elements[0].tags.website;
                                } else if (elements[0].tags.wikipedia != null) {
                                    wiki = elements[0].tags.wikipedia.split(':');
                                    out.url = "http://www." + wiki[0] + ".wikipedia.org/wiki/" + wiki[1];
                                } else if (elements[0].tags.url != null) {
                                    out.url = elements[0].tags.url;
                                } else if (elements[0].tags.facebook != null) {
                                    out.url = elements[0].tags.facebook;
                                } else {
                                    out.url = "";
                                }
                                if (elements[0].tags.description != null) {
                                    out.description = elements[0].tags.description;
                                } else {
                                    out.description = "";
                                }
                                tags = [];
                                ref2 = elements[0].tags;
                                for (key in ref2) {
                                    value = ref2[key];
                                    if (key === 'tourism') {
                                        tags.push(key);
                                        tags.push(value);
                                        if (value === 'hotel' || value === 'alpine_hut' || value === 'hostel' || value === 'motel' || value === 'camp_site' || value === 'caravan_site' || value === 'wilderness_hut') {
                                            tags.push('accomodation');
                                            tags.push('hut');
                                        }
                                    }
                                    if (key === 'natural') {
                                        tags.push(value);
                                    }
                                    //if (value === 'peak') {
                                        //tags.push(value);
                                    //}
                                    if ((key === 'bus' && value === 'yes') || (key === 'highway' && value === 'bus_stop') || (key === 'railway' && value === 'bus_stop')) {
                                        tags.push('bus');
                                        tags.push('public_transport');
                                    }
                                    if ((key === 'train' && value === 'yes') || (key === 'highway' && value === 'train_stop') || (key === 'railway' && value === 'station')) {
                                        tags.push('train');
                                        tags.push('public_transport');
                                    }
                                    if (key === 'public_transport') {
                                        tags.push(key);
                                    }
                                    if (key === 'amenity') {
                                        tags.push(value);
                                    }
                                    if (key === 'sport') {
                                        tags.push(value);
                                    }
                                }
                                $log.debug(tags);
                                out.tags = clean_tags(tags);
                                $log.debug(out.tags);
                            } else {
                                out.name = "";
                                out.url = "";
                                out.description = "";
                                out.tags = [];
                            }
                            out.queryLink = "http://overpass-turbo.eu?R&Q="+qryAll;
                            return callback(out);
                        });
                        return true;
                    };
                };


            });

}());
