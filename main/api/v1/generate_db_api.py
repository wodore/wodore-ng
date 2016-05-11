# coding: utf-8
# pylint: disable=too-few-public-methods, no-self-use, missing-docstring, unused-argument
from flask_restful import Resource
from main import API
from flask import abort
from config import DEVELOPMENT
from model.factories import UserFactory, CollectionFactory, WayPointFactory
from google.appengine.ext import ndb #pylint: disable=import-error
from api.helpers import make_empty_ok_response
import model
import auth

@API.resource('/api/v1/generate_database')
class GenerateDatabaseAPI(Resource):
    @ndb.toplevel
    def post(self):
        """Generates mock data for development purposes"""
        if not DEVELOPMENT:
            abort(404)
        UserFactory.create_batch(20)
        #CollectionFactory.create(30,"tburgherr@gmail.com")
        CollectionFactory.create_private()
        CollectionFactory.create(5,None)
        CollectionFactory.create(10,"random", start_nr=6)
        # Create Big Mountain collection
        user_key = auth.current_user_key()
        big_mt_key=model.Collection.create(name="Big Mountain",
                creator=user_key,
                avatar_url='https://pixabay.com/static/uploads/photo/2015/09/02/12/27/matterhorn-918442_960_720.jpg'
                )
        CollectionFactory.add_users(max_collections=50,user_min=2,user_max=10)

        model.Collection.create_or_update(key=big_mt_key,description="Something in the mountains")
        WayPointFactory.create(30)
        WayPointFactory.create(5,1000,4,[big_mt_key])
        return make_empty_ok_response()
