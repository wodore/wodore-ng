# coding: utf-8
# pylint: disable=too-few-public-methods, no-self-use, missing-docstring, unused-argument
"""
Provides API logic relevant to users
"""
from flask_restful import reqparse, Resource

import auth
import util

from main import API
from model import User, UserValidator
import model
from api.helpers import ArgumentValidator, make_list_response, make_empty_ok_response, make_bad_request_exception
from flask import request, g, abort
from pydash import _
from api.decorators import model_by_key, user_by_username, authorization_required, admin_required, login_required, collection_permission
from flask_restful import inputs
from google.appengine.ext import ndb #pylint: disable=import-error

from collections import OrderedDict

# names should be separated by a , (comma)
@API.resource('/api/v1/waypoints/<string:collection>/<string:key>')
class WaypointAPI(Resource):
    @login_required
    def get(self,collection,key):
        """Updates user's properties"""
        tags = model.Tag.get_tag_infos(names.split(','),collection,True)
        return make_list_response(tags, False, False, len(tags))


# TODO not tested yet, see wdTags add_async
@API.resource('/api/v1/waypoints/<string:collection>')
class AddWaypointAPI(Resource):
    @login_required
    @collection_permission('read')
    def get(self, collection):
        print "Get waypoints"
        parser = reqparse.RequestParser()
        parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
        parser.add_argument('size', type=int, default=10)
        parser.add_argument('noTotal', type=ArgumentValidator.create('boolTrue'),default=False)
        parser.add_argument('newer', default=None)
        parser.add_argument('offset', type=int, default=None) # newer date - offset (in seconds)
        #parser.add_argument('only_approved',default=True)
        #parser.add_argument('collection',default='')
        #parser.add_argument('toplevel',default='')
        #parser.add_argument('count_greater',type=int,default=0)
        args = parser.parse_args()
        args.total = not args.noTotal
        #try:
            #toplevel_key=ndb.Key(urlsafe=args.toplevel)
        #except:
            #toplevel_key=None
        #try:
            #collection_key=ndb.Key(urlsafe=args.collection)
        #except:
            #return make_bad_request_exception("Wrong collection key")
        query = model.WayPoint.qry(collection=g.col_key,compare_date='>modified',date=args.newer, time_offset=args.offset)
        wps_future = query.fetch_page_async(args.size, start_cursor=args.cursor)
        if args.total:
            total_count_future = query.count_async(keys_only=True)
        wps, next_cursor, more = wps_future.get_result()
        wps = [u.to_dict(include=model.WayPoint.get_public_properties()) for u in wps]
        if args.total:
            total_count = total_count_future.get_result()
        else:
            total_count = None
        return make_list_response(wps, next_cursor, more, total_count)






    @login_required
    @collection_permission('write')
    def put(self, collection):
        """Updates waypoint properties"""
        print "Update waypoint property"
        update_properties = ['name', 'creator', 'description', 'key']
# TODO urls
        update_properties = ['collection', 'key','name','description','tags','geo']
        data = _.pick(request.json, update_properties)
        if 'collection' not in data:
            if data['collection'] != collection:
                return make_bad_request_exception("Wrong collection key")
            else:
                data['collection'] = collection


        if 'creator' not in data:
            data['creator'] = auth.current_user_key()
        else:
            data['creator'] =  ndb.Key(urlsafe=data['creator'])
        if 'geo' in data:
            data['geo'] = ndb.GeoPt(data['geo'])
        try:
            data['key'] = ndb.Key(urlsafe=data['key'])
        except:
            data['key'] = None
        try:
            data['collection'] = ndb.Key(urlsafe=data['collection'])
        except:
            return make_bad_request_exception("Wrong collection key")
        #print data
        # TODO key from new data or as argument
        key = model.WayPoint.create_or_update(**data)
        return {'key':key.urlsafe(),'id':key.id()}
        #return make_empty_ok_response()



@API.resource('/api/v1/waypoints/<string:collection>/suggestions/<string:query>')
class WaypointSearchAPI(Resource):

    def get(self, collection,query):
        parser = reqparse.RequestParser()
        parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
        #parser.add_argument('q', type=str,default='')
        parser.add_argument('size', type=int,default=30)
        parser.add_argument('only_names', type=ArgumentValidator.create('boolTrue'),default=False)
        args = parser.parse_args()
        tags = []
        try:
            collection = ndb.Key(urlsafe=collection)
        except:
            collection = model.Collection.top_key()

        # Check if the user has read permission for the collection TODO
        if auth.is_admin():
            # check if name is already a full tag
            key = model.Tag.tag_to_key(query,collection)
            try:
                db = key.get()
            except:
                key = model.Tag.tag_to_key(query)
                try:
                    db = key.get()
                except:
                    db = False
            if db:
                dbs_related, more = db.related(char_limit=200)
                #tags = [db.name] + db.related()
                tags = [r.related_to for r in dbs_related]
                tags = [db.name] + tags
            else:
                gae_qry = model.Tag.query(model.Tag.collection == collection)
                if len(query) > 1:
                    gae_qry = gae_qry \
                        .filter(model.Tag.name >= query) \
                        .filter(model.Tag.name <= unicode(query) + u"\ufffd")\
                        .order(model.Tag.name)
                else:
                    gae_qry = gae_qry.order(model.Tag.cnt)
                tags_future =  gae_qry.fetch_async(
                                    limit=args.size,
                                    projection=['name'])
                tags = tags_future.get_result()
                tags = [r.name for r in tags]
                rel_tags = []
                for tag in tags:
                    key = model.Tag.tag_to_key(tag,collection)
                    try:
                        db = key.get()
                        if db:
                            dbs_related, more = db.related(char_limit=100)
                            rel_tags = [r.related_to for r in dbs_related]
                            tags = tags+rel_tags #[:5]
                    except:
                        pass
                    if len(tags) > args.size+5:
                        break
                #tags = list(set(tags))
            tags = list(OrderedDict.fromkeys(tags))
            total = len(tags)
            tags = tags[:args.size]
            if not args.only_names:
                tags = model.Tag.get_tag_infos(tags,collection)
        return make_list_response(tags, False, total > len(tags), total)


