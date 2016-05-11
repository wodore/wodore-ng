# coding: utf-8
from __future__ import absolute_import

from google.appengine.ext import ndb

import flask
#import wtforms

import auth
import config
import model
import control
import util

import os
from main import app


from .init import *

import cloudstorage as gcs

from google.appengine.api import images
from google.appengine.ext import blobstore

###############################################################################
# Initialization Stuff
###############################################################################
#class InitForm(wtf.Form):
#  tags = wtforms.TextAreaField(model.Config.announcement_html._verbose_name, filters=[util.strip_filter])
#  brand_name = wtforms.StringField(model.Config.brand_name._verbose_name, [wtforms.validators.required()], filters=[util.strip_filter])
#  check_unique_email = wtforms.BooleanField(model.Config.check_unique_email._verbose_name)
#  email_authentication = wtforms.BooleanField(model.Config.email_authentication._verbose_name)
#  feedback_email = wtforms.StringField(model.Config.feedback_email._verbose_name, [wtforms.validators.optional(), wtforms.validators.email()], filters=[util.email_filter])
#  notify_on_new_user = wtforms.BooleanField(model.Config.notify_on_new_user._verbose_name)
#  verify_email = wtforms.BooleanField(model.Config.verify_email._verbose_name)
#  icon  = wtforms.FileField(u'Icons')

@app.route('/admin/init/', methods=['GET', 'POST'])
#@auth.admin_required
def admin_init():
    config_db = model.Config.get_master_db()
    if not config_db.app_initialized:
        # init models
        # Create a public collection, used as toplevel collection
        db = model.Collection(id=model.Collection.top_id(), \
              name='Public Collection',
              description='',
              active=True,
              public=True,
              creator=auth.current_user_key())
        col_key = db.put()




        # ICON init
        icons = icon_init.icons_new
        names = ""
        tag_icon_ids = {}
        fs = flask.request.files.getlist("icon")
        cnt = 0
        for name, icon in icons.iteritems():
            print "Add icon '{}'".format(name)
            path = os.path.join(os.path.split(__file__)[0], 'init/icons/svg',name+'.svg')
            try:
                f = open(path, "r")
                data = f.read()
            except:
                continue
            tags =  model.TagValidator.name(icon.get('tags',"")\
                      .split(',')) if icon.get('tags') else []
            keywords =  model.TagValidator.name(icon.get('keywords',"")\
                      .split(',')) if icon.get('keywords') else []
            icon_key = model.Icon.create(icon=data,
                name=name,
                author_html = icon.get('author_html'),
                comment = icon.get('comment'),
                filetype = icon.get('filetype'),
                keywords = model.TagValidator.name(keywords + tags)
                )
            print "Author: {}".format(icon.get('author_html',"what"))
            for tag in tags:
                try:
                    tag_icon_ids[tag] = icon_key.id()
                except:
                    pass
        ## TAG init
        tags_new = tag_init.tags_new
        for name in tags_new:
            for tag in tags_new[name]["tags"]:
                try:
                    icon_id = tag_icon_ids[tag]
                except:
                    icon_id = None
                print "Add tag '{}' ({})".format(tag,len(tag))
                model.Tag.add(tag,color=tags_new[name]["color"],icon_id=icon_id,\
                      auto_incr=False,approved=True)
            keys = model.TagRelation.add(tags_new[name]["tags"],\
                   _incr_step=tags_new[name]["incr"])
        tags_relation = tag_init.tags_relation
        for name in tags_relation:
            keys = model.TagRelation.add(tags_relation[name]["tags"],\
                 _incr_step=tags_relation[name]["incr"])


        #config_db.app_initialized = True
        config_db.put()
        return flask.make_response("<h1>App initialized</h1>")
    return flask.make_response("<h1>App already initialized</h1>")


