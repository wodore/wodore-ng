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

import cloudstorage as gcs
from config import BUCKET


from google.appengine.api import images
from google.appengine.ext import blobstore

@API.resource('/api/v1/upload/<string:collection>/<string:category>/<string:name>')
class UploadMediaAPI(Resource):
    @login_required
    def get(self,collection,category,name):
        """Updates user's properties"""
        if auth.is_admin() or model.Collection.has_permission(collection,auth.current_user_key().urlsafe(),'read',urlsafe=True):
            adr =  BUCKET + '/' + collection + '/' + category + '/' + name
            blob_key = blobstore.create_gs_key('/gs' + adr)
            img_url = images.get_serving_url(blob_key=blob_key)
            return img_url
        return "No permission"

        properties = model.Collection.get_private_properties()
        properties = model.Collection.get_public_properties()
        return g.model_db.to_dict(include=properties+['permission','permissionNr'])



    @login_required
    def post(self,collection,category,name):
        """Saves a resource in the cloud storage

        Multiple files are possible, if multiple files are uploaded the 'name' needs to be 'multiple'.
        For multiple files the file name is take as name.
        If multiple fils are uploaded without 'multiple' only the last file is saved.
        The function can also gerenate a serving link, this is either public or private (not guessable).
        """
        link =  request.form.get('link',default=False) # either public, private or False
        gcs_links = []
        api_links = []
        private_links = []
        links = []
        for k,f in request.files.iteritems(multi=False):
            write_retry_params = gcs.RetryParams(backoff_factor=1.1)
            if name == 'multiple':
                name = f.filename
            adr =  "{}/{}/{}/{}".format(BUCKET, collection, category, name)
            gcs_file = gcs.open(adr, 'w',
              content_type=f.mimetype,
              options={
                'x-goog-meta-name': f.filename
                    },
             retry_params=write_retry_params)
            f.save(gcs_file) # saves file to cloud storage
            gcs_file.close()
            f.close()
            gcs_links.append("/_ah/gcs"+adr)
            api_links.append("/api/v1/upload/"+collection + '/' + category + '/' + name)
            links.append("/resource/"+collection + '/' + category + '/' + name)
            if link == 'private': #TODO implement public links
                blob_key = blobstore.create_gs_key('/gs' + adr)
                img_url = images.get_serving_url(blob_key=blob_key)
                private_links.append(img_url)


        return {'links': links,
                'private_links': private_links,
                'gcs_links': gcs_links,
                'api_links': api_links
                }
        #return make_empty_ok_response()


