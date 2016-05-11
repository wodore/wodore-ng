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
from api.decorators import model_by_key, user_by_username, authorization_required, admin_required, login_required
from flask_restful import inputs
from google.appengine.ext import ndb #pylint: disable=import-error

from collections import OrderedDict

@API.resource('/api/v1/tags')
class TagsAPI(Resource):
    """Gets list of collections. Uses ndb Cursor for pagination.
    Only show collections which the user is member of, except for admins.
    """
    @admin_required
    def get(self):
        print "Get tags"
        parser = reqparse.RequestParser()
        parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
        parser.add_argument('size', type=int, default=10)
        parser.add_argument('total', type=ArgumentValidator.create('boolTrue'),default=True)
        parser.add_argument('only_approved',default=True)
        parser.add_argument('collection',default='')
        parser.add_argument('toplevel',default='')
        parser.add_argument('count_greater',type=int,default=0)
        args = parser.parse_args()
        try:
            toplevel_key=ndb.Key(urlsafe=args.toplevel)
        except:
            toplevel_key=None
        try:
            collection_key=ndb.Key(urlsafe=args.collection)
        except:
            collection_key=None
        query = model.Tag.qry(toplevel=toplevel_key,
                            collection=collection_key,
                            only_approved=args.only_approved,
                            count_greater=args.count_greater)
        tags_future = query.fetch_page_async(args.size, start_cursor=args.cursor)
        if args.total:
            total_count_future = query.count_async(keys_only=True)
        tags, next_cursor, more = tags_future.get_result()
        tags = [u.to_dict(include=model.Tag.get_public_properties()) for u in tags]
        #print next_cursor
        if args.total:
            total_count = total_count_future.get_result()
        else:
            total_count = None
        return make_list_response(tags, next_cursor, more, total_count)

# names should be separated by a , (comma)
@API.resource('/api/v1/tags/<string:collection>/<string:names>')
class TagAPI(Resource):
    @login_required
    def get(self,collection,names):
        """Updates user's properties"""
        tags = model.Tag.get_tag_infos(names.split(','),collection,True)
        return make_list_response(tags, False, False, len(tags))


# TODO not tested yet, see wdTags add_async
@API.resource('/api/v1/tags/<string:collection>')
class AddTagAPI(Resource):
    @login_required
    def put(self,collection):
        """Updates user's properties"""
        #update_properties = ['name', 'collection', 'toplevel', 'icon_key', 'color', 'force_new_icon','auto_incr']
        #print request.json
        #data = _.pick(request.json, update_properties)
        data = request.json
        print "Data is:"
        print data

        if 'force_new_icon' not in data:
            data['force_new_icon'] = False
        if 'auto_incr' not in data:
            data['auto_incr'] = False
        if 'tag_details' not in data:
            data['tag_details'] = []
        try:
            data['collection'] = ndb.Key(urlsafe=data['collection'])
        except:
            return make_bad_request_exception("Wrong collection key")
        #print data
        tag_list = []
        # Check tag properties and add tag
        for tag in data['tag_details']:
            #if 'toplevel' not in tag:
                #tag['toplevel'] = None
            #else:
                #try:
                    #tag['toplevel'] = ndb.Key(urlsafe=tag['toplevel'])
                #except:
                    #tag['toplevel'] = None
            if 'icon_key' not in tag:
                tag['icon_key'] = None
            else:
                try:
                    tag['icon_key'] = ndb.Key(urlsafe=tag['icon_key'])
                except:
                    pass
            tag['collection'] = data['collection']
            print "Arguments for add tag"
            print tag
            key = model.Tag.add(**tag)
            tag_list.append(tag['name'])

        tags = model.Tag.get_tag_infos(tag_list,data['collection'])
        return make_list_response(tags, False, False, len(tags))
        #return make_empty_ok_response()


@API.resource('/api/v1/tags/<string:collection>/suggestions/<string:query>')
class TagSearchAPI(Resource):

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


