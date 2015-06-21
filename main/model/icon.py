# coding: utf-8
from __future__ import absolute_import

from google.appengine.ext import ndb

#from api import fields
import model
import util
import config
from .counter import CountableLazy
from .collection import Collection, AddCollection
import config

"""
An icon consists of two model classes:
  IconStructure: Which helds all icon specific data but no additional information.
  Icon: The Icon model contains an IconStructure as an icon and additional information
        like a counter and collection.

For each icon exists a toplevel icon which can have children grouped by collection.
Once an icon is created it should not be changed anymore.
If one of the childrens counter is updated the topevel icon's counter is updated
as well.
The highest toplevel has the default collection Collection.top_key().
"""

class IconValidator(model.BaseValidator):
    name = [2,30]

class Icon(CountableLazy, AddCollection, model.Base):
    name = ndb.StringProperty(required=True,\
          validator=IconValidator.create('name'))
    #icon = ndb.StructuredProperty(IconStructure)
    icon = ndb.BlobProperty(required=True)
    private = ndb.BooleanProperty(required=True,default=False) # not shown for others
                         # private means inside its collection
    replaced_by = ndb.KeyProperty(kind='Icon') # if the icon should not be used anymore
    fallback = ndb.KeyProperty(kind='Icon') # fallback icon, for example a png for a svg
    external_source = ndb.StringProperty(indexed=False) # not recommended
    filetype = ndb.StringProperty(choices=['svg','pixel','external'],indexed=True,
                       default='svg', required=True)

    #see: http://support.flaticon.com/hc/en-us/articles/202798381-How-to-attribute-the-icons-to-their-authors
    # this would be the author link
    author_html = ndb.StringProperty()
    comment = ndb.TextProperty()

    # take as keywords the tags from flaticon
    keywords = ndb.StringProperty(indexed=True,repeated=True)

    @classmethod
    def create(cls,icon,name,collection=Collection.top_key(),\
        toplevel=None, private=False, author_html=None,\
        fallback=None, external_source=None, \
        filetype=None, keywords=None, comment=None, auto=True):
      """ Creates and puts a new icon to the database.
      As icon is the source code expected (svg or image).
      Keywords should be a list.
      Returns Icon key"""
      new_icon = Icon(icon = icon,
          name=name,
          collection=collection,
          private=private)
      if toplevel:
          new_icon.toplevel = toplevel
      if fallback:
          new_icon.toplevel = fallback
      if author_html:
          new_icon.author_html = author_html
      if external_source:
          new_icon.external_source = external_source
      if filetype:
          new_icon.filetype = filetype
      if comment:
          new_icon.comment = comment
      if keywords:
# TODO check keywords (tag validator) and make list unique
          new_icon.keywords = keywords
      key = new_icon._add_and_put(auto=auto)
      return key

    @classmethod
    def add(cls,key,collection=None, as_child=False):
        """ Add a icon which already exists by key.

        If no collection or the same belonging to the key is given the icon
        counter is increased by one.

        If the collection is different two things can happen:

        1. If the key's collection is Collection.top_key() (no toplevel) or 'as_child' is true:
           The key is assigned as toplevel.
           ('as_child' means the icon is added with key as toplevel)

        2. It is not a toplevel key:
           The property 'toplevel' is assigned as key.

        In both cases a toplevel is set. The next step is to look for a icon with
        the same toplevel and collection, if one exists its counter is increased.
        If none exists a new one is created.
          """
        icon_db = key.get()
        if icon_db.collection == collection or not collection:
            icon_db.incr()
            icon_db.put()
            return key
        else:
            if collection == Collection.top_key():
                return self.add(icon_db.toplevel,collection)
            elif icon_db.collection == Collection.top_key() or as_child:
                toplevel = key
            else:
                toplevel = icon_db.toplevel

        ## Look for icons with same toplevel and collection
        keys = Icon.get_by_toplevel(toplevel, collection=collection, keys_only=True, limit=1)
        if keys:
            #for key in keys:
            key = keys[0]
            return Icon.add(key,collection)
        else:
            return Icon.create(icon_db.icon,icon_db.name,collection=collection,toplevel=toplevel)

    @classmethod
    def remove(cls,id):
        """Removes a icon by its key

        Remove means its counter is decreased by one"""
        key = cls.id_to_key(id)
        icon_db = key.get()
        icon_db.decr()
        icon_db.put()

    def get_tags(self,limit=10):
        """Fetches tags which are used together with this icon

        returns a tag dbs and a variable more if more tags are available."""
#TODO write test
        dbs = model.Tag.query(model.Tag.icon_id==self.key.id())\
            .order(-model.Tag.cnt).fetch(limit+1)
        if len(dbs) > limit:
            more = True
        else:
            more = False
        return dbs, more



    @classmethod
    def qry(cls, toplevel=None, name=None, collection=None, private=False,
          replaced_by=None, order_by_count=True, **kwargs):
        """Query for the icon model"""
        qry = cls.query(**kwargs)
        if toplevel:
            qry_tmp = qry
            qry = qry.filter(cls.toplevel==toplevel)
        if name:
            qry_tmp = qry
            qry = qry.filter(cls.name==name,)
        if collection:
            qry_tmp = qry
            qry = qry.filter(cls.collection == collection)
        if not private:
            qry_tmp = qry
            qry = qry_tmp.filter(cls.private==False)
        if order_by_count:
            qry_tmp = qry
            qry = qry.order(-cls.cnt)
        #else filter for private True and False

        return qry

    @classmethod
    def get_by_toplevel(cls, toplevel=None, collection=None, private=False,
        keys_only=False, limit=100):
        """Returns icon dbs or keys defined by its toplevel and some addition parameters"""
        return cls.qry(toplevel=toplevel,collection=collection,private=private).\
            fetch(keys_only=keys_only, limit=limit)

    @classmethod
    def get_dbs(
        cls, name=None, private=None, \
            replaced_by=None, **kwargs
            ):
        kwargs = cls.get_col_dbs(**kwargs)
        kwargs = cls.get_counter_dbs(**kwargs)
        return super(Icon, cls).get_dbs(
            name=name or util.param('name', None),
            private=private or util.param('private', bool),
            replaced_by=replaced_by or util.param('replaced_by', ndb.Key),
            **kwargs
          )


    def _add_and_put(self, auto=True):
        """ Adds and puts an icon to the DB

        If 'auto' is true it automatically creates a toplevel icon if none is given.
        This only works for one level, if a higher hierarchy is required it needs to be
        done manually.
        """
        if not getattr(self,'toplevel',None) \
              and self.collection != Collection.top_key() \
              and auto \
              and not self.private: #no toplevel if private
            #top = Icon(icon=self.icon,name=self.name)

            top = Icon(icon=self.icon,name=self.name,\
                       private=False,  \
                       external_source=self.external_source, \
                       filetype=self.filetype, keywords=self.keywords)
            if getattr(self,'fallback',None) : # TODO test fallbacks
                fallback_db = fallback.get()
                fallback_key = getattr(fallback_db,'toplevel',None) # take toplevel if available
                if not fallback_key:
                    fallback_key = self.fallback
                top.fallback=fallback_key

            top_key = top.put()
            self.toplevel = top_key

        self.incr()
        self.put()
        #self.get_icon()
        return self.key



class Iconize(ndb.Model):
    """Adds an icon property

    Icons are managed in the 'Icon' model, this mzixins
    adds two methods to deal with icons:
      'add_icon': if an icon already exists it can be added by its key
      'create_icon': create a new icon

    The two method 'put' the icons automatically, this means it is recommanded to
    put the iconized model as well or remove the icon again if something went wrong.
      """
    #icon = ndb.StructuredProperty(IconStructure)
    icon_id = ndb.IntegerProperty(indexed=True,required=True, default=0)

    def add_icon(self, key=None, id=None):
        """Adds an icon by key or id, the key is either a toplevel key or an icon key.
        'id' needs to be a integer."""
        if id:
            key = Icon.id_to_key(id)
        elif key:
            id = key.id()
        else:
            return False
        if not getattr(self,'collection',None):
            col = Collection.top_key()
        else:
            col = self.collection
        key = Icon.add(key,collection=col)
        #self.icon = key.get().get_icon()
        self.icon_id = key.id()

    def create_icon(self,icon,name,private=False):
        if not getattr(self,'collection',None):
            col = Collection.top_key()
        else:
            col = self.collection
        key = Icon.create(icon=icon,name=name,collection=col,private=private)
        #icon.icon_key = key
        #self.icon = icon
        self.icon_id = key.id()

    def remove_icon(self):
        if getattr(self,'icon_id',None):
            Icon.remove(self.icon_id)
        self.icon_id = 0

## TODO write test
# shuld not be used anymore, replaced by get_icon_id
    def get_icon_key(self):
        if getattr(self,'icon',None):
            return self.icon.icon_key
        elif getattr(self,'toplevel',None):
            top_db = self.toplevel.get()
            if getattr(top_db,'icon',None):
                return top_db.icon.icon_key
        else:
            None

    def get_icon_id(self):
        if getattr(self,'icon_id',None):
            return self.icon_id
        elif getattr(self,'toplevel',None):
            top_db = self.toplevel.get()
            if getattr(top_db,'icon_id',None):
                return top_db.icon_id
        else:
            None

