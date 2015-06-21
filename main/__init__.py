# coding: utf-8
"""
gae-angular-material-starter
~~~~~~~~

Fastest way to start Google App Engine Angular Material project on Earth & Mars!

https://github.com/gae-angular-material-starter
http://gae-angular-material-starter.appspot.com

by Matus Lestan.
License MIT, see LICENSE for more details.

"""

__version__ = '1'

# During test the import fails.
try:
    from .main import API
    from .main import app
except AssertionError:
    print "[main init] import did not work."
