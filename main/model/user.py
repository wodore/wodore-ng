# coding: utf-8
"""Provides implementation of User model and User"""
from __future__ import absolute_import

import hashlib
from google.appengine.ext import ndb
import model
import util


class UserValidator(model.BaseValidator):
    """Defines how to create validators for user properties. For detailed description see BaseValidator"""
    name = [0, 100]
    username = [3, 40]
    password = [6, 70]
    email = util.EMAIL_REGEX
    bio = [0, 140]
    location = [0, 70]
    social = [0, 50]
    avatar_url = util.URL_REGEX

    @classmethod
    def token(cls, token):
        """Validates if given token is in datastore"""
        user_db = User.get_by('token', token)
        if not user_db:
            raise ValueError('Sorry, your token is either invalid or expired.')
        return token

    @classmethod
    def existing_email(cls, email):
        """Validates if given email is in datastore"""
        user_db = User.get_by('email', email)
        if not user_db:
            raise ValueError('This email is not in our database.')
        return email

    @classmethod
    def unique_email(cls, email):
        """Validates if given email is not in datastore"""
        user_db = User.get_by('email', email)
        if user_db:
            raise ValueError('Sorry, this email is already taken.')
        return email

    @classmethod
    def unique_username(cls, username):
        """Validates if given username is not in datastore"""
        if not User.is_username_available(username):
            raise ValueError('Sorry, this username is already taken.')
        return username


class User(model.Base):
    """A class describing datastore users."""
    name = ndb.StringProperty(default='', validator=UserValidator.create('name'))
    username = ndb.StringProperty(required=True, validator=UserValidator.create('username'))
    email = ndb.StringProperty(default='', validator=UserValidator.create('email', required=False))
    avatar_url = ndb.StringProperty(default='', validator=UserValidator.create('avatar_url', required=False))
    auth_ids = ndb.StringProperty(repeated=True)
    active = ndb.BooleanProperty(default=True)
    admin = ndb.BooleanProperty(default=False)
    permissions = ndb.StringProperty(repeated=True)
    verified = ndb.BooleanProperty(default=False)
    token = ndb.StringProperty(default='')
    password_hash = ndb.StringProperty(default='')
    bio = ndb.StringProperty(default='', validator=UserValidator.create('bio'))
    location = ndb.StringProperty(default='', validator=UserValidator.create('location'))
    facebook = ndb.StringProperty(default='', validator=UserValidator.create('social'))
    twitter = ndb.StringProperty(default='', validator=UserValidator.create('social'))
    gplus = ndb.StringProperty(default='', validator=UserValidator.create('social'))
    instagram = ndb.StringProperty(default='', validator=UserValidator.create('social'))
    linkedin = ndb.StringProperty(default='', validator=UserValidator.create('social'))
    github = ndb.StringProperty(default='', validator=UserValidator.create('social'))

    PUBLIC_PROPERTIES = ['avatar_url', 'name', 'username', 'bio', 'location',
                         'facebook', 'twitter', 'gplus', 'linkedin', 'github', 'instagram']

    PRIVATE_PROPERTIES = ['admin', 'active', 'auth_ids', 'email', 'permissions', 'verified']

    #@property
    #def avatar_url(self):
        #"""Returns gravatar url, created from user's email or username"""
        #if self.link_to_avatar != '':
            #return self.link_to_avatar
        #else:
            #return '//gravatar.com/avatar/%(hash)s?d=identicon&r=x&s=45' % {
                #'hash': hashlib.md5(
                    #(self.email or self.username).encode('utf-8')).hexdigest()
            #}

    def has_password(self, password):
        """Tests if user has given password"""
        return self.password_hash == util.password_hash(password)

    @classmethod
    def is_username_available(cls, username):
        """Tests if user has username is available"""
        return cls.get_by('username', username) is None

    @classmethod
    def get_by_credentials(cls, email_or_username, password):
        """Gets user model instance by email or username with given password"""
        try:
            email_or_username == User.email
        except ValueError:
            cond = email_or_username == User.username
        else:
            cond = email_or_username == User.email
        user_db = User.query(cond).get()

        if user_db and user_db.password_hash == util.password_hash(password):
            return user_db
        return None

    @classmethod
    def get_by_email_or_username(cls, email_or_username):
        """Gets user model instance by email or username"""
        try:
            email_or_username == User.email
        except ValueError:
            cond = email_or_username == User.username
        else:
            cond = email_or_username == User.email
        user_db = User.query(cond).get()
        return user_db

    @classmethod
    def get_dbs(
              cls, admin=None, active=None, verified=None, permissions=None, **kwargs
            ):
        return super(User, cls).get_dbs(
                admin=admin or util.param('admin', bool),
                active=active or util.param('active', bool),
                verified=verified or util.param('verified', bool),
                permissions=permissions or util.param('permissions', list),
                **kwargs
              )

    def _pre_put_hook(self):
        if self.avatar_url == '':
            self.avatar_url =  'https://gravatar.com/avatar/{hash}s?d=identicon&r=x&s=45'.format(hash=hashlib.md5((self.email or self.username).encode('utf-8')).hexdigest())



