# coding: utf-8

from __future__ import absolute_import

from google.appengine.ext import ndb

# import do not work yet (for unit test)
# add them later
import model
#import util
#import config

#from .tag import Taggable#, TagStructure, Tag, TagRelation
from .counter import CountableLazy

from flask_restful import inputs


class CollectionValidator(model.BaseValidator):
    name = [2,20]
    description = [0,140]


class Collection(CountableLazy, model.Base):
    """Collection model.

    This model saves all collections.
    The model CollectionUser saves all user which belong to a collection.
    The propertiy 'cnt' counts the user per collection.
    If 'public' is true this means every one can see it.
    if 'private' is true this means it is a private collection and no other user
       can be added.
    if neither, which is usually the case, user can be added to the collection.
       (it is something between ;) )
    A collection can be inactive, if this is the case it can only be seen,
       but no changes are possible anymore. (This is a cotroller task)
    """
    name = ndb.StringProperty(required=True,\
        validator=CollectionValidator.create('name'))
    description = ndb.TextProperty(validator=CollectionValidator.create('description'))
    active = ndb.BooleanProperty(required=True,default=True)
    public = ndb.BooleanProperty(required=True,default=False)
    private = ndb.BooleanProperty(required=True,default=False)
    creator = ndb.KeyProperty(kind="User") # default: current user key

    @staticmethod
    def top_key():
        """ Returns key of the 'global' collection """
        return ndb.Key('Collection','global')

    @classmethod
    def top_keyname(cls):
        """ Returns key of the 'global' collection """
        return cls.top_id()

    @staticmethod
    def top_id():
        """ Returns key of the 'global' collection """
        return 'global'

    @classmethod
    def create_or_update_private(cls,creator_key=None, \
            creator_db=None):
        """ Creates a private collection """
        print "Create private user collection"
        if model.CollectionUser.update_user(\
            user_db=creator_db, user_key=creator_key):
            return True
        if creator_key:
            creator_db = creator_key.get()
        if not creator_db:
            return False
        else:
            creator_key = creator_db.key
        return cls.create(name='Private'.format(creator_db.email),\
            description='Private group for {}'.format(creator_db.username),\
            creator=creator_key,public=False,\
            active=True,private=True)


    @classmethod
    def create_or_update(cls,key=None,**kwargs):
        """ Updates a collection or creates a new one """
        if key:
            db = key.get()
            db.populate(**kwargs)
            db.put()
            CollectionUser.update_collection(col_db=db)
            return db.key
        else:
            print "Arguments for create"
            print kwargs
            return cls.create(**kwargs)

    @classmethod
    def create(cls,name,creator,description=None,public=False,\
          private=False, active=True):
        """ Creates and puts a new collection to the database.
        The property creator is mandatory, it is best to given the current logged
        in user with: auth.current_user_key()

        Returns collection key
        """
        new_col = Collection(name=name,creator=creator,active=active, \
           private=private, public=public)
        if description != None:
            new_col.description = description
        else:
            new_col.description = ""

        col_key =  new_col.put()
        cls.add_users(col_key,[creator],permission='creator')
        return col_key

    @classmethod
    def add_users(cls,collection_key,user_key_list,permission='read',active=True,urlsafe=False):
        """Add users to a collection.

        The default permission is 'read'.
        If the permission is different per user the user list needs to have the
        following form:
        user_key_list=[[key1,permission1],[key2,permission2],...]
            or
        user_key_list=[{Key:key1,permission:permission1},,...]

        and persmission=False!

        This function can also be used to update a user (for example permission)
        """
        multi_permissions = not permission
        if urlsafe:
            collection_key = ndb.Key(urlsafe=collection_key)
        db_col = collection_key.get()
        for user_key in user_key_list:
            if multi_permissions:
                try:
                    permission = user_key[1]
                except:
                    permission = user_key['permission']
                try:
                    user_key = user_key[0]
                except:
                    user_key = user_key['key']
            if urlsafe:
                user_key = ndb.Key(urlsafe=user_key)
            user_db = user_key.get()
            if not user_db:
                continue
              # TODO create key with email (function in User)
            db, new = CollectionUser.get_or_create(CollectionUser.to_key_id(user_key), \
                parent=collection_key,user=user_key, \
                permission=permission, user_collection_active=active, \
                user_name = user_db.name, user_username=user_db.username,\
                user_email=user_db.email, user_active=user_db.active, \
                user_avatar_url = user_db.avatar_url, \
                collection=collection_key, \
                name = db_col.name, \
                description = db_col.description, \
                active = db_col.active, \
                private = db_col.private, \
                public = db_col.public)
            changed = False
            if not new: # make updates
                if db.permission != permission and db.permission != 'creator':
                    # it is not possible to change the permission from creator to something else
                    db.permission = permission
                    changed = True
                if db.active != active:
                    db.active = active
                    changed = True
            if changed or new:
                db.put()
            if new:
                db_col.incr()

        db_col.put()

    @classmethod
    def remove_users(cls,collection_key,user_key_list,urlsafe=False):
        """Remove users from a collection.
        """
        if urlsafe:
            collection_key = ndb.Key(urlsafe=collection_key)
        db_col = collection_key.get()
        keys = []
        keys_checked = []
        for user_key in user_key_list:
            if urlsafe:
                user_key = ndb.Key(urlsafe=user_key)
            keys.append(CollectionUser.to_key(collection_key, user_key))
        dbs_to_check = ndb.get_multi(keys)
        for db in dbs_to_check:
            if db:
                keys_checked.append(db.key)
        deleted = ndb.delete_multi(keys_checked)
        db_col.decr(len(deleted))
        db_col.put()

    @classmethod
    def has_permission(cls,collection_key,user_key,\
        permission=None, equal=False, urlsafe=False):
        """Checks if a user has a certain permission for a collection.

        Possible permissions are: 'creator', 'admin, 'write', 'read', 'none'.
        The permissions on the left include the one on the right as well.
        For example: 'admin' also has 'write' permission.
        If the flag equal=True then the permission must be equal ('admin' != 'write')
        If permission=None it returns the current permission
        """
        if urlsafe:
            collection_key = ndb.Key(urlsafe=collection_key)
            user_key = ndb.Key(urlsafe=user_key)
        db_col = CollectionUser.to_key(collection_key, user_key).get()
        if not db_col:
            return  'none'
        if not permission:
            return db_col.permission
        if not equal:
            return CollectionUser.permission_to_number(db_col.permission) >= \
               CollectionUser.permission_to_number(permission)
        else:
            return CollectionUser.permission_to_number(db_col.permission) == \
               CollectionUser.permission_to_number(permission)




    @classmethod
    def qry(cls, name=None, active=True, public='both', \
          private='both', creator=None, \
          order_by_date='modified', **kwargs):
        """Query for collections, if active='both' it is not queried for active."""
        qry = cls.query(**kwargs)
        if name:
            qry_tmp = qry
            qry = qry.filter(cls.name==name)
        if creator:
            qry_tmp = qry
            qry = qry.filter(cls.creator==creator)
        if str(active).lower() == 'both':
            pass # nothing needed
        elif inputs.boolean(active):
            qry_tmp = qry
            qry = qry.filter(cls.active==True)
        elif not inputs.boolean(active):
            qry_tmp = qry
            qry = qry.filter(cls.active==False)
        if str(public).lower() == 'both':
            pass # nothing needed
        elif inputs.boolean(public):
            qry_tmp = qry
            qry = qry.filter(cls.public==True)
        elif not inputs.boolean(public):
            qry_tmp = qry
            qry = qry.filter(cls.public==False)
        if str(private).lower() == 'both':
            pass # nothing needed
        elif inputs.boolean(private):
            qry_tmp = qry
            qry = qry.filter(cls.private==True)
        elif not inputs.boolean(private):
            qry_tmp = qry
            qry = qry.filter(cls.private==False)
        if order_by_date == 'modified':
            qry_tmp = qry
            qry = qry.order(-cls.modified)
        elif order_by_date == 'created':
            qry_tmp = qry
            qry = qry.order(-cls.created)
        #else filter for private True and False
        return qry

    @staticmethod
    def print_list(dbs):
        print "\n+-------------------+-------------------+-------------------+"\
            +"-------------------+-------------------+-----------------------------+"
        print "| {:<18}| {:<18}| {:<18}| {:<18}| {:<18}| {:<28}|".\
            format("name", "description", "active","public","users", "creator", )
        print "+-------------------+-------------------+-------------------+"\
            +"-------------------+-------------------+-----------------------------+"
        for db in dbs:
          print "| {:<18}| {:<18}| {:<18}| {:<18}| {:<18}| {:<28}|".\
              format(db.name, db.description, db.active, db.public,db.count, db.creator)
        print "+-------------------+-------------------+-------------------+"\
            +"-------------------+-------------------+-----------------------------+"
        print
        print


    @classmethod
    def get_dbs(
          cls, name=None, active=None, creator=None,\
            public=None, private=None, **kwargs
        ):
        return super(Collection, cls).get_dbs(
            name=name or util.param('name', None),
            active=active or util.param('active', bool),
            private=private or util.param('private', bool),
            public=public or util.param('public', bool),
            creator=creator or util.param('creator', ndb.Key),
            **kwargs
          )


    #FIELDS = {
        #'name' : fields.String,
        #'active' : fields.Boolean,
        #'public' : fields.Boolean,
        #'private' : fields.Boolean,
        #'creator' : fields.Key
      #}
#
    #FIELDS.update(model.Base.FIELDS)

    PUBLIC_PROPERTIES = ['name', 'description', 'active', 'creator', 'public', 'private', 'cnt']

    PRIVATE_PROPERTIES = []



class AddCollection(ndb.Model):
    """ Adds a collection ant toplevel properties
    """


    collection = ndb.KeyProperty(kind='Collection', required=True, \
        default=Collection.top_key())
    toplevel = ndb.KeyProperty()

    def get_collection_name(self):
        """ Returns the name of the collection """
        db = model.Collection.\
          query(model.Collection.key==self.collection).\
          get(projection=[model.Collection.name])

        return db.name

    def get_collection_basic(self):
        """ Returns the main field of the collection """
        db = model.Collection.\
          query(model.Collection.key==self.collection).\
          get(projection=[model.Collection.name,
          model.Collection.creator,
          model.Collection.active,
          model.Collection.private,
          model.Collection.public
          ])
        if not db:
            db = self.collection.get()
        return db

    def get_collection_db(self):
        """ Returns the collection db """
        return self.collection.get()

    def has_permission(self,permission=None, equal=False):
        """Returns if the user has permission or wich permission.

        Possible permissions are: 'creator', 'admin, 'write', 'read', 'none'.
        The permissions on the left include the one on the right as well.
        For example: 'admin' also has 'write' permission.
        If the flag equal=True then the permission must be equal ('admin' != 'write')
        If permission=None it returns the current permission
        """
        import auth # TODO better way??
        usr = auth.current_user_key()
        return model.Collection.has_permission(self.collection,usr,\
           permission,equal)

    @classmethod
    def get_col_dbs(
          cls, collection=None, toplevel=None, col_id=None, **kwargs
        ):
        """ Call this function when 'AddCollection' is used int the 'get_dbs' function.
        """
        col_id = col_id or  util.param('col_id')
        if col_id and not collection:
            collection = model.Collection.id_to_key(col_id)
        kwargs["collection"] = collection
        kwargs["toplevel"] = toplevel
        return kwargs


class CollectionUser(AddCollection, model.Base):
    """Collection with User model.

    This model saves all users added to a collections.
    The collection key should be used as parent.
    """
     # collection should be the same as 'parent'
    user = ndb.KeyProperty(kind="User",required=True) # default: current user key
    user_collection_active = ndb.BooleanProperty(required=True,default=True)
    permission = ndb.StringProperty(required=True,
        choices=['creator', 'admin','write','read','none'], default='read')
    user_name = ndb.StringProperty(required=True) # name property of User
    user_username = ndb.StringProperty(required=True) # username of User
    user_email = ndb.StringProperty(default='') # email of the user
    user_active = ndb.BooleanProperty(default=True) # is the user active
    user_avatar_url = ndb.StringProperty()
    name = ndb.StringProperty(required=True)
    description = ndb.TextProperty(required=True,default='')
    active =  ndb.BooleanProperty(required=True,default=True)
    private = ndb.BooleanProperty(required=True,default=False)
    public =  ndb.BooleanProperty(required=True,default=False)

    @classmethod
    def update_user(cls, user_key=None, user_db=None):
        """Updates the user_* fields if a user changed"""
# TODO user a tasklet for this!!
# TODO add this to the user_update method in control/user.py
# TODO ad user_* to qry!
        if user_key:
            user_db = user_key.get()
        else:
            user_key = user_db.key
        if not user_db:
            return False
        # get all collections for this user
        dbs = []
        for db in cls.qry(user=user_key):
            db.user_name = user_db.name
            db.user_username = user_db.username
            db.user_email = user_db.email
            db.user_active = user_db.active
            if user_db.avatar_url:
                db.user_avatar_url = user_db.avatar_url
            dbs.append(db)
        return ndb.put_multi(dbs)

    @classmethod
    def update_collection(cls, col_key=None, col_db=None):
        """Updates the user_* fields if a user changed"""
# TODO user a tasklet for this!!
        if col_key:
            col_db = col_key.get()
        else:
            col_key = col_db.key
        if not col_db:
            return False
        # get all collections for this user
        dbs = []
        for db in cls.qry(collection=col_key):
            #print db
            db.name = col_db.name
            db.description = col_db.description
            db.active = col_db.active
            db.private = col_db.private
            db.public = col_db.public
            dbs.append(db)
        return ndb.put_multi(dbs)



    @staticmethod
    def permission_to_number(permission):
        """Returns a number for the permision"""
        perm_dic = {'none' : 0,
                    'read' : 1,
                    'write' : 2,
                    'admin' : 3,
                    'creator' : 5}
        return perm_dic[permission]

    @staticmethod
    def to_key_id(user_key):
        """Returns a key name (string)"""
        return "col_user__{}".format(user_key.urlsafe())

    @staticmethod
    def to_key(collection_key, user_key):
        """Returns a key"""
        return ndb.Key("CollectionUser", CollectionUser.to_key_id(user_key),\
            parent=collection_key)

    @classmethod
    def qry(cls, user=None, collection=None, user_collection_active=True, permission=None, \
        user_email=None,
        order_by_date='modified', **kwargs):
        """Query for collections, if active='both' it is not queried for active."""
        if collection:
            qry = cls.query(ancestor=collection,**kwargs)
        else:
            qry = cls.query(**kwargs)
        if user:
            qry_tmp = qry
            qry = qry.filter(cls.user==user)
        #if collection:
            #qry_tmp = qry
            #qry = qry.ancestor(collection)
        if user_collection_active == 'both':
            pass # nothing needed
        elif user_collection_active:
            qry_tmp = qry
            qry = qry.filter(cls.user_collection_active==True)
        elif not user_collection_active:
            qry_tmp = qry
            qry = qry.filter(cls.user_collection_active==False)
        if permission:
            qry_tmp = qry
            qry = qry.filter(cls.permission==permission)
        if user_email:
            qry_tmp = qry
            qry = qry.filter(cls.user_email==user_email)
        if order_by_date == 'modified':
            qry_tmp = qry
            qry = qry.order(-cls.modified)
        elif order_by_date == 'created':
            qry_tmp = qry
            qry = qry.order(-cls.created)
        #else filter for private True and False
        return qry


    @staticmethod
    def print_list(dbs):
        print "\n+-----------------------------+-----------------------------+-------------------+"\
            +"-------------------+-------------------+-------------------+"
        print "| {:<28}| {:<28}| {:<18}| {:<18}| {:<18}| {:<18}|".\
            format("parent (collection)", "user", "user_collection_active","permission","...", "...", )
        print "+-----------------------------+-----------------------------+-------------------+"\
            +"-------------------+-------------------+-------------------+"
        for db in dbs:
            print "| {:<28}| {:<28}| {:<18}| {:<18}| {:<18}| {:<18}|".\
              format(db.key.parent() or None, db.user_name, \
                    db.user_collection_active, db.permission,"","")
        print "+-----------------------------+-----------------------------+-------------------+"\
            +"-------------------+-------------------+-------------------+"
        print
        print

    @classmethod
    def get_dbs(
        cls, user=None, user_collection_active=None, permission=None,
        user_name=None, user_username=None, user_email=None,\
        user_active=None, **kwargs
              ):
        kwargs = cls.get_col_dbs(**kwargs)
        return super(CollectionUser, cls).get_dbs(
            user=user or util.param('user', ndb.Key),
            user_collection_active=user_collection_active or util.param('user_collection_active', bool),
            permission=permission or util.param('permission', str),
            user_name=user_name or util.param('user_name', str),
            user_username=user_username or util.param('user_username', str),
            user_email=user_email or util.param('user_email', str),
            user_active=user_active or util.param('user_active', str),
            **kwargs
          )

    PUBLIC_PROPERTIES = ['user_collection_active', 'user_name', 'user_username', 'user_email', 'user_active', 'user_avatar_url', 'name', 'description', 'private', 'public','permission','active','collection','user']

    PRIVATE_PROPERTIES = ['', '']

    ####FIELDS = { # parent key?
        #'user' : fields.Key,
        #'collection' : fields.Key,
        #'active' : fields.Boolean,
        #'permission' : fields.String
      #}
#
    #FIELDS.update(model.Base.FIELDS)


