# pylint: disable=no-init, old-style-class
"""Provides implementation of UserFactory"""

from base_factory import BaseFactory
from model import Collection
import model
from factory.fuzzy import FuzzyText, FuzzyChoice
from faker import Factory
import factory
import util
import random
from google.appengine.ext import ndb


class CollectionFactory(BaseFactory):
    """Factory for creating mock users"""
    #class Meta: # pylint: disable=missing-docstring
        #model = Collection

    #name = factory.Sequence(lambda n: 'Group %d' % n)
    #description = FuzzyChoice(['They see me rollin\'', 'They hatin\''])
    #active = FuzzyChoice([True, False])
    #public = FuzzyChoice([True, False])
    #private = FuzzyChoice([True, False])
    #creator = ndb.Key('User',random.randint(1, 30))

    @classmethod
    def create_batch(cls, size, **kwargs):
        """When creating batch, we create one less than requested size and then add admin user
        at the end"""
        super(CollectionFactory, cls).create_batch(size, **kwargs)
        #cls.create_admin()

    @classmethod
    def create_private(cls):
        user_keys = model.User.query().fetch(limit=1000, keys_only=True)
        for key in user_keys:
            model.Collection.create_or_update_private(creator_key=key)


    @classmethod
    def create(cls,size,creator=None,start_nr=1):
        """ If creator is None the current user is used,
        creator set to an email adress this user is used or set to "random"
        in order to use different, random users"""

        print "Create collections"
        fake = Factory.create()
        # description length
        desc_min = 0
        desc_max = 120
        creator_random = False
        import auth
        if not creator: # DOES NOT work, WHY?
            print "Take current user key as creator"
            print auth.current_user_key()
            creator = auth.current_user_key()
        elif not creator == "random":
            print "User by email: {}".format(creator)
            user_db = model.User.get_by_email_or_username(creator)
            if not user_db:
                print "ERROR: No user found by this email"
                return False
            else:
                print user_db.key
                creator = user_db.key

        else: # random user
            creator_random = True
            user_keys = model.User.query().fetch(limit=5000, keys_only=True)

        for i in range(size):
            if creator_random:
                creator = random.choice(user_keys)
            sentence_length = int(desc_min+\
                 random.random()*(desc_max-desc_min))
            if sentence_length <= 5:
                desc = ""
            else:
                desc = fake.text(max_nb_chars=sentence_length)
            name="{} {}".format(start_nr+i,fake.city())
            if len(name) > 20:
                name = name[0:19]
            elif len(name) < 2:
                name = name+" Longer"
            print creator
            print name
            print desc
            model.Collection.create(name=name,
                creator=creator,
                description=desc,
                active=True,
                public=False,
                private=False
                )


    @classmethod
    def add_users(cls, max_collections=100,user_min=0,user_max=20, permission="random"):
        #TODO add this to a task!
        # it takes quite a long time
        #fake = Factory.create()
        permission_list = ('none','read','write','admin','creator')
        user_keys = model.User.query().fetch(limit=1000, keys_only=True)
        cnt = 0
        cnt_users = 0
        for key in model.Collection.qry(private=False,public=False)\
              .fetch(keys_only=True, limit=max_collections):
            user_nr = int(user_min+random.random()*(user_max-user_min))
            cnt_users += user_nr
            users = random.sample(user_keys,user_nr)
            if permission == "random":
              users_perm = []
              for user in users:
                users_perm.append((user,random.choice(permission_list)))
              model.Collection.add_users(key,users_perm,permission=False)
            else:
              model.Collection.add_users(key,users,\
                  permission=permission)
            cnt += 1
        print 'Added a total of {usr_nr} users to {nr} collections'.\
                format(usr_nr=cnt_users, nr=cnt)




