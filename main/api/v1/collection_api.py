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


@API.resource('/api/v1/collections')
class CollectionsAPI(Resource):
    """Gets list of collections. Uses ndb Cursor for pagination.
    Only show collections which the user is member of, except for admins.
    """
    @admin_required
    def get(self):
        print "Get collections"
        parser = reqparse.RequestParser()
        parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
        parser.add_argument('size', type=int, default=10)
        parser.add_argument('total', type=int, default=True)
        parser.add_argument('private',default='both')
        parser.add_argument('active',default='both')
        parser.add_argument('public',default='both')
        args = parser.parse_args()
        #print args

        query = model.Collection.qry(private=args.private,
                                                 active=args.active,
                                                 order_by_date='modified')

        #print query
        collections_future = query.fetch_page_async(args.size, start_cursor=args.cursor)
        if args.total:
            total_count_future = query.count_async(keys_only=True)
        collections, next_cursor, more = collections_future.get_result()
        collections = [u.to_dict(include=model.Collection.get_public_properties()) for u in collections]
        #print next_cursor
        if args.total:
            total_count = total_count_future.get_result()
        else:
            total_count = None
        return make_list_response(collections, next_cursor, more, total_count)



#@API.resource('/api/v1/collections/<string:username>')
@API.resource('/api/v1/users/<string:username>/collections')
class CollectionsByUsernameAPI(Resource):
    @user_by_username
    def get(self, username):
        """Loads user's properties. If logged user is admin it loads also non public properties"""
        #print g.user_db.key
        parser = reqparse.RequestParser()
        parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
        parser.add_argument('showAll', type=ArgumentValidator.create('boolTrue'),default=False)
        parser.add_argument('size', type=int, default=10)
        parser.add_argument('total', type=ArgumentValidator.create('boolTrue'),default=True)
        args = parser.parse_args()

        if args.showAll:
            user_key = None
        else:
            user_key = g.user_db.key

        if auth.is_admin() or user_db.key == auth.current_user_key():
            query = model.CollectionUser.qry(user=user_key)
            collections_future =  query.fetch_page_async(args.size, start_cursor=args.cursor)

            if args.total:
                total_count_future = query.count_async(keys_only=True)

            collections, next_cursor, more = collections_future.get_result()
            collections = [u.to_dict(include=model.CollectionUser.get_public_properties()) for u in collections]

            if args.total:
                total_count = total_count_future.get_result()
            else:
                total_count = None
            return make_list_response(collections, next_cursor, more, total_count)
        else:
            return make_bad_request_exception



@API.resource('/api/v1/collections/<string:key>')
class CollectionAPI(Resource):
    @login_required
    @model_by_key
    def get(self,key):
        """Updates user's properties"""

        if auth.is_admin():
            properties = model.Collection.get_private_properties()
        else:
            properties = model.Collection.get_public_properties()
        g.model_db.permission = model.Collection.has_permission(g.model_key,auth.current_user_key())
        g.model_db.permissionNr = model.CollectionUser.permission_to_number(g.model_db.permission)
        return g.model_db.to_dict(include=properties+['permission','permissionNr'])


    @login_required
    def put(self,key):
        """Updates user's properties"""
        update_properties = ['name', 'creator', 'description', 'public', 'private', 'active','key']
        #print request.json
        data = _.pick(request.json, update_properties)

        #print data
        if 'creator' not in data:
            data['creator'] = auth.current_user_key()
        else:
            data['creator'] =  ndb.Key(urlsafe=data['creator'])
        try:
            data['key'] = ndb.Key(urlsafe=data['key'])
        except:
            data['key'] = None
        #print data
        # TODO key from new data or as argument
        print "Arguments for create_or_update"
        print data
        key = model.Collection.create_or_update(**data)
        if auth.is_admin():
            properties = model.Collection.get_private_properties()
        else:
            properties = model.Collection.get_public_properties()
        return {'key':key.urlsafe()}
        #return make_empty_ok_response()



@API.resource('/api/v1/collections/<string:key_urlsafe>/users')
class CollectionUsers(Resource):
    def get(self, key_urlsafe):
        """Loads user's properties. If logged user is admin it loads also non public properties"""
        key = ndb.Key(urlsafe=key_urlsafe)
        #print key
        parser = reqparse.RequestParser()
        parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
        parser.add_argument('showAll', type=ArgumentValidator.create('boolTrue'),default=False)
        parser.add_argument('size', type=int, default=10)
        parser.add_argument('total', type=ArgumentValidator.create('boolTrue'),default=True)
        args = parser.parse_args()


        permission = model.Collection.has_permission(key,auth.current_user_key(),"read")

        if auth.is_admin() or permission:
            query = model.CollectionUser.qry(collection=key)
            #print query
            collections_future =  query.fetch_page_async(args.size, start_cursor=args.cursor)
            if args.total:
                total_count_future = query.count_async(keys_only=True)
            collections, next_cursor, more = collections_future.get_result()
            #print collections
            collections = [u.to_dict(include=model.CollectionUser.get_public_properties()) for u in collections]
            #collections = [u.to_dict() for u in collections]
            #print collections
            if args.total:
                total_count = total_count_future.get_result()
            else:
                total_count = None
            return make_list_response(collections, next_cursor, more, total_count)
        else:
            return make_bad_request_exception

    def put(self, key_urlsafe):
        permission = model.Collection.has_permission(ndb.Key(urlsafe=key_urlsafe),auth.current_user_key(),"write")
        if auth.is_admin() or permission:
            data = _.pick(request.json, ['user_add','user_remove_keys'])
            user_add = data['user_add']
            user_remove_keys = data['user_remove_keys']
            model.Collection.add_users(key_urlsafe,
                    user_add,
                    permission=False,urlsafe=True)
            model.Collection.remove_users(key_urlsafe,user_remove_keys,urlsafe=True)
            return make_empty_ok_response()
        return abort(401)






@API.resource('/api/v1/users/<string:key>')
class CollectionsByKeyAPI(Resource):
    @authorization_required
    @model_by_key
    def put(self, key):
        """Updates user's properties"""

        update_properties = ['name', 'creator', 'description', 'public', 'private', 'active']
        new_data = _.pick(request.json, update_properties)
        #print new_data
        model.Collection.create(**new_data)
        return make_empty_ok_response()

