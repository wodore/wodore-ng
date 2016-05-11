# coding: utf-8

from __future__ import absolute_import

from google.appengine.ext import ndb

# import do not work yet (for unit test)
# add them later
import model
import util
import config

#TODO import Taggable

#class WayPoint(model.Base): # does not work with unit test yet
from .tag import Taggable#, TagStructure, Tag, TagRelation
from .collection import Collection, AddCollection


class WayPointValidator(model.BaseValidator):
    name = [1,20]
    description = [0,2000]

class WayPoint( model.Base, Taggable, AddCollection):
    name = ndb.StringProperty(required=True,\
        validator=WayPointValidator.create('name'))
    description = ndb.TextProperty(validator=WayPointValidator.create('description'))
    url = ndb.StringProperty(validator=lambda p, v: v.lower())
    geo = ndb.GeoPtProperty(indexed=True) # lat/long coordinates
    custom_fields = ndb.GenericProperty(repeated=True)
    creator = ndb.KeyProperty(kind="User") # default: current user key


    @classmethod
    def create_or_update(cls,key=None,**kwargs):
        """ Updates a collection or creates a new one """
        new_tags = kwargs.get('tags',[])
        if key:
            db = key.get()
            kwargs['tags'] = db['tags']
            db.populate(**kwargs)
        else:
            kwargs['tags'] = []
            db = cls(**kwargs)
        db.update_tags(new_tags)
        key = db.put()
        return key




    @classmethod
    def qry(cls, name=None, collection=None, tag=None, \
          url=None, **kwargs):
        """Query for way points"""
        #qry = cls.query(**kwargs)
        qry = model.Base.qry(model.WayPoint,**kwargs)
        if name:
            qry = qry.filter(cls.name==name)
        if collection:
            qry = qry.filter(cls.collection==collection)
        if tag:
            qry = qry.filter(cls.tags==tag)
        if url:
            qry = qry.filter(cls.url==url.lower())
        #else filter for private True and False
        return qry

    @classmethod
    def get_dbs(
          cls, name=None,
          tags=None, creator=None, geo=None, **kwargs
        ):
        kwargs = cls.get_col_dbs(**kwargs)
        kwargs = cls.get_tag_dbs(**kwargs)
        return super(WayPoint, cls).get_dbs(
            name=name or util.param('name', str),
            creator=creator or util.param('creator', ndb.Key),
            geo=geo or util.param('geo', str),
            **kwargs
          )

    @staticmethod
    def print_list(dbs):
        print "\n+-------------------+-------------------+-------------------+"\
            +"-------------------+-------------------+-----------------------"
        print "| {:<18}| {:<18}| {:<18}| {:<18}| {:<18}| {:<14} {:<48}".\
            format("name", "collection", "description", "url", "geo", "tags", "custom field")
        print "+-------------------+-------------------+-------------------+"\
            +"-------------------+-------------------+-----------------------"
        for db in dbs:
            print "| {:<18}| {:<18}| {:<18}| {:<18}| {:<18}|{:<14} {:<48}".\
                  format(db.name, db.collection, db.description, db.url, db.geo,
                  db.tags,db.custom_fields)
        print "+-------------------+-------------------+-------------------+"\
            +"-------------------+-------------------+-----------------------"
        print
        print

    PUBLIC_PROPERTIES = ['name', 'collection','description','url','geo','creator','tags']

    PRIVATE_PROPERTIES = []


# ADD them later
#  @classmethod
#  def get_dbs(
#      cls, admin=None, active=None, verified=None, permissions=None, **kwargs
#    ):
#    return super(User, cls).get_dbs(
#        admin=admin or util.param('admin', bool),
#        active=active or util.param('active', bool),
#        verified=verified or util.param('verified', bool),
#        permissions=permissions or util.param('permissions', list),
#        **kwargs
#      )
#
#
