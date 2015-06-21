"""
License: MIT <http://brianmhunt.mit-license.org/>
"""
import sys
#sys.path.append('/home/tobias/data/git/wodore-gae/main/')
#sys.path.append('./')
sys.path.append('./model')

import logging
import unittest

from google.appengine.ext import ndb#, testbed


from counter import CountableLazy


class TestCountLazyModel(CountableLazy, ndb.Model):
  """This is a test class for trying out counters
  """
  name = ndb.StringProperty()

class TestCountLazyModelExtended(CountableLazy, ndb.Model):
  """This is a test class for trying out counters
  """
  name = ndb.StringProperty()
  toplevel = ndb.KeyProperty()
  collection = ndb.StringProperty(required=True, indexed=True,
                  default='global', validator=lambda p, v: v.lower())



class TestTags(unittest.TestCase):

  # enable the datastore stub
  nosegae_datastore_v3 = True
  nosegae_memcache = True

  def setUp(self):
    pass

  def tearDown(self):
    pass


  def test_init(self):
    tclm = TestCountLazyModel(name="X")
    tclm.put()
    assert tclm is not None
    self.assertEqual(tclm.count, 0)

  def test_counter_incr(self):
    tclm = TestCountLazyModel(name="X")
    tclm.incr()
    self.assertEqual(tclm.count, 1)
    tclm.incr(2)
    self.assertEqual(tclm.count, 3)
    tclm.put()
    self.assertEqual(tclm.count, 3)

  def test_counter_decr(self):
    tclm = TestCountLazyModel(name="X")
    tclm.decr()
    self.assertEqual(tclm.count, -1)
    tclm.decr(2)
    self.assertEqual(tclm.count, -3)
    tclm.put()

  def test_counter_saved(self):
    tclm = TestCountLazyModel(name="X")
    tclm.incr()
    key = tclm.put()
    self.assertEqual(str(key),"Key('TestCountLazyModel', 1)")
    tclm2 = key.get()
    self.assertEqual(tclm2.count, 1)

  def test_counter_incr_with_toplevel(self):
    top = TestCountLazyModelExtended(name="top")
    top_key = top.put()
    mid = TestCountLazyModelExtended(name="mid",
        toplevel = top_key,
        collection = 'mid')
    mid_key = mid.put()
    bot = TestCountLazyModelExtended(name="bot",
        toplevel = mid_key,
        collection = 'bot')
    bot_key = bot.put()
    self.assertEqual(top.count, 0)
    self.assertEqual(mid.count, 0)
    self.assertEqual(bot.count, 0)
    bot.incr()
    bot.put()
    self.assertEqual(top.count, 1)
    self.assertEqual(mid.count, 1)
    self.assertEqual(bot.count, 1)
    mid.incr()
    mid.put()
    self.assertEqual(top.count, 2)
    self.assertEqual(mid.count, 2)
    self.assertEqual(bot.count, 1)
    top.incr()
    top.put()
    self.assertEqual(top.count, 3)
    self.assertEqual(mid.count, 2)
    self.assertEqual(bot.count, 1)

if __name__ == "__main__":
    unittest.main()
