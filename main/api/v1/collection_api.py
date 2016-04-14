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
from flask import request, g
from pydash import _
from api.decorators import model_by_key, user_by_username, authorization_required, admin_required, login_required


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



@API.resource('/api/v1/collections/<string:username>')
class CollectionsByUsernameAPI(Resource):
    @user_by_username
    def get(self, username):
        """Loads user's properties. If logged user is admin it loads also non public properties"""
        print g.user_db.key

        if auth.is_admin() or g.user_db.key == auth.current_user_key():
            parser = reqparse.RequestParser()
            parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
            args = parser.parse_args()

            #collections_future = model.CollectionUser.query() \
                #.order(-model.CollectionUser.created) \
                #.fetch_page_async(10, start_cursor=args.cursor)
            collections_future = model.CollectionUser.qry(user=g.user_db.key) \
                .fetch_page_async(10, start_cursor=args.cursor)

            total_count_future = model.CollectionUser.qry(user=g.user_db.key).count_async(keys_only=True)
            collections, next_cursor, more = collections_future.get_result()
            collections = [u.to_dict(include=model.CollectionUser.get_public_properties()) for u in collections]
            return make_list_response(collections, next_cursor, more, total_count_future.get_result())
        else:
            return make_bad_request_exception



@API.resource('/api/v1/collection')
class CollectionAPI(Resource):
    @login_required
    def put(self):
        """Updates user's properties"""

        update_properties = ['name', 'creator', 'description', 'public', 'private', 'active']
        new_data = _.pick(request.json, update_properties)
        print new_data
        if 'creator' not in new_data:
            new_data['creator'] = auth.current_user_key()
        print new_data
        model.Collection.create(**new_data)
        return make_empty_ok_response()


@API.resource('/api/v1/users/<string:key>')
class CollectionsByKeyAPI(Resource):
    @authorization_required
    @model_by_key
    def put(self, key):
        """Updates user's properties"""

        update_properties = ['name', 'creator', 'description', 'public', 'private', 'active']
        new_data = _.pick(request.json, update_properties)
        print new_data
        model.Collection.create(**new_data)
        return make_empty_ok_response()

