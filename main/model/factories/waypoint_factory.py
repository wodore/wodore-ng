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


class WayPointFactory(BaseFactory):
    """Factory for creating mock waypoints"""



    @classmethod
    def create(cls,nr_of_collections=50, max_waypoints=30, max_tags=3,
            collection_keys=None):
        """ Creates for 'nr_of_collections' collections up to
            'max_waypoints' waypoints with up to 'max_tags'."""

        print "==================================================="
        print "Create waypooints"
        print
        if not collection_keys:
            col_keys = model.Collection.qry().\
                      fetch(limit=nr_of_collections,\
                      keys_only=True)
        else:
            col_keys = collection_keys

        tag_dbs, _ = model.Tag.get_dbs(collection=model.Collection.top_key(), limit=5000)
        tag_list = [db.name for db in tag_dbs]
        dbs = []
        cnt = 0
        # Create a fake instance
        fake = Factory.create()
        # create waypoints
        for key in col_keys:
            print "Waypoints for collection '{}'".format(key)
            print "---------------------------------------------------"
            # Generate random number of waypoints per collection (gauss)
            wayPT = random.gauss(max_waypoints/2*1.2,max_waypoints/3)
            wayPT = int(wayPT) if wayPT > 1 else max_waypoints
            print "Goint to create {} new waypoints".format(wayPT)
            for i in range(0,wayPT):
                name = fake.word()
                desc = fake.sentence()
                # roughly switzerland
                lat = random.random()*3+45
                lng = random.random()*4 + 6
                geo = ndb.GeoPt(lat,lng)
                db = model.WayPoint(name=name,description=desc,collection=key,geo=geo)
                if tag_list and max_tags:
                    tag_nr = int(random.random()*max_tags)+1
                    print "Add {} tags".format(tag_nr)
                    while tag_nr > len(tag_list):
                        tag_nr -=1
                    db.add_tags(random.sample(tag_list,tag_nr))
                dbs.append(db)
                cnt += 1
                print "Waypoint nr {} '{}'".format(cnt,name)
        ndb.put_multi(dbs)
        print "---------------------------------------------------"
        print "{} waypoints created".format(cnt)
        print

