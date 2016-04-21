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
from api.helpers import ArgumentValidator, make_list_response, make_empty_ok_response
from flask import request, g
from pydash import _
from api.decorators import model_by_key, user_by_username, authorization_required, admin_required
import datetime

@API.resource('/api/v1/users')
class UsersAPI(Resource):
    """Gets list of users. Uses ndb Cursor for pagination. Obtaining users is executed
    in parallel with obtaining total count via *_async functions
    """
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
        args = parser.parse_args()

        users_future = User.query() \
            .order(-User.created) \
            .fetch_page_async(10, start_cursor=args.cursor)

        total_count_future = User.query().count_async(keys_only=True)
        users, next_cursor, more = users_future.get_result()
        users = [u.to_dict(include=User.get_public_properties()) for u in users]
        return make_list_response(users, next_cursor, more, total_count_future.get_result())


@API.resource('/api/v1/users/<string:username>')
class UserByUsernameAPI(Resource):
    @user_by_username
    def get(self, username):
        """Loads user's properties. If logged user is admin it loads also non public properties"""
        if auth.is_admin():
            properties = User.get_private_properties()
        else:
            properties = User.get_public_properties()
        return g.user_db.to_dict(include=properties)

@API.resource('/api/v1/users/<string:username>/suggestions')
class UserSearchAPI(Resource):

    @user_by_username
    def get(self, username):
        parser = reqparse.RequestParser()
        parser.add_argument('cursor', type=ArgumentValidator.create('cursor'))
        parser.add_argument('q', type=str,default='')
        parser.add_argument('size', type=int,default=10)
        args = parser.parse_args()

        # current user key
        user_key = g.user_db.key
        if auth.is_admin() or user_db.key == auth.current_user_key():
            query = model.CollectionUser.qry(user=user_key)
            collection_keys_future =  query.fetch_async(limit=args.size*4,keys_only=True)
            # do something else here?
            collection_keys = collection_keys_future.get_result()
            collection_keys = [key.parent() for key in collection_keys]

            # Search for users in this collections
            users = [];
            for key in collection_keys:
                query = model.CollectionUser.query(ancestor=key)
                if len(args.q) > 1:
                    query = query \
                        .filter(model.CollectionUser.user_username >= args.q) \
                        .filter(model.CollectionUser.user_username <= unicode(args.q) + u"\ufffd")\
                        .order(model.CollectionUser.user_username)
                else:
                    query = query.order(model.CollectionUser.modified)

                users_future =  query.fetch_async(
                                    limit=args.size,
                                    projection=['modified','user','user_username','user_email','user_avatar_url'])
                users = users + users_future.get_result()
                #users = users + [{'key':u.key,'modified':u.modified} for u in users_future.get_result()]
            # check if a user with this name or email exists:
            user_db = model.User.get_by_email_or_username(args.q) if len(args.q)>2 else None
            if user_db:
                user = model.CollectionUser(user= user_db.key,
                        user_username = user_db.username,
                        user_email = user_db.email,
                        user_avatar_url = user_db.avatar_url,
                        name = "Just Temp User",
                        modified = datetime.datetime.now(),
                        created = datetime.datetime.now())
                users.append(user)
            # sort users after its last modification
            users = util.sort_uniq(users,'modified','user_username',reverse=False)
            #users = [u.urlsafe() for u in users]
            users = [u.to_dict(include=['modified','user','user_username','user_email','user_avatar_url']) for u in users]

            total = len(users)
            if total > args.size:
                users = users[:args.size]
            return make_list_response(users, None, total > args.size, total)




        users_query = User.query()
        if len(args.q) > 2:
            users_query = users_query \
                .filter(User.username >= args.q) \
                .filter(User.username <= unicode(args.q) + u"\ufffd")
        users_future = users_query \
            .order(User.username) \
            .fetch_page_async(15, start_cursor=args.cursor)

        #total_count_future = User.query().count_async(keys_only=True)
        users, next_cursor, more = users_future.get_result()
        users = [u.to_dict(include=['name','username','email','avatar_url']) for u in users]
        return make_list_response(users, next_cursor, more, None)



@API.resource('/api/v1/users/<string:key>')
class UserByKeyAPI(Resource):
    @authorization_required
    @model_by_key
    def put(self, key):
        """Updates user's properties"""
        update_properties = ['name', 'bio', 'email', 'location', 'facebook', 'github',
                             'gplus', 'linkedin', 'twitter', 'instagram']
        if auth.is_admin():
            update_properties += ['verified', 'active', 'admin']

        new_data = _.pick(request.json, update_properties)
        g.model_db.populate(**new_data)
        g.model_db.put()
        return make_empty_ok_response()

    @admin_required
    @model_by_key
    def delete(self, key):
        """Deletes user"""
        g.model_key.delete()
        return make_empty_ok_response()


@API.resource('/api/v1/users/<string:key>/password')
class UserPasswordAPI(Resource):
    @authorization_required
    @model_by_key
    def post(self, key):
        """Changes user's password"""
        parser = reqparse.RequestParser()
        parser.add_argument('currentPassword', type=UserValidator.create('password', required=False), dest='current_password')
        parser.add_argument('newPassword', type=UserValidator.create('password'), dest='new_password')
        args = parser.parse_args()
        # Users, who signed up via social networks have empty password_hash, so they have to be allowed
        # to change it as well
        if g.model_db.password_hash != '' and not g.model_db.has_password(args.current_password):
            raise ValueError('Given password is incorrect.')
        g.model_db.password_hash = util.password_hash(args.new_password)
        g.model_db.put()
        return make_empty_ok_response()


