# coding: utf-8
"""
Provides logic for non-api routes related to user
"""
from google.appengine.api import images
from google.appengine.ext import blobstore

import flask
from main import app

import auth
import model
import util


from config import BUCKET

@app.route('/resource/<string:collection>/<string:category>/<string:name>', methods=['GET']) # pylint: disable=missing-docstring
def get_resource(collection,category,name):
# TODO auth.is_admin and collectio permission does not work !!! -> used True or
    if True or auth.is_admin() or model.Collection.has_permission(collection,auth.current_user_key().urlsafe(),'read',urlsafe=True):
        adr =  BUCKET + '/' + collection + '/' + category + '/' + name
        blob_key = blobstore.create_gs_key('/gs' + adr)
        img_url = images.get_serving_url(blob_key=blob_key)
        print img_url
        return flask.redirect(img_url)
