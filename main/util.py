# coding: utf-8
"""
Set of utility function used throughout the app
"""
from uuid import uuid4
import hashlib
import re
from google.appengine.ext import ndb #pylint: disable=import-error
import config
from pydash import _
import itertools, operator

EMAIL_REGEX = r'^[-!#$%&\'*+\\.\/0-9=?A-Za-z^_`{|}~]+@([-0-9A-Za-z]+\.)+([0-9A-Za-z]){2,4}$'

# see: https://gist.github.com/dperini/729294 (PYTHON PORT)
URL_REGEX = r'^(?:(?:https?|ftp)://)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:/\S*)?$'


def uuid():
    """Generates random UUID used as user token for verification, reseting password etc.

    Returns:
      string: 32 characters long string

    """
    return uuid4().hex


def create_name_from_email(email):
    """Function tries to recreate real name from email address

    Examples:
      >>> create_name_from_email('bobby.tables@email.com')
      Bobby Tables
      >>> create_name_from_email('bobby-tables@email.com')
      Bobby Tables

    Args:
      email (string): Email address

    Returns:
      string: Hopefully user's real name

    """
    return re.sub(r'_+|-+|\.+|\++', ' ', email.split('@')[0]).title()


def password_hash(password):
    """Hashes given plain text password with sha256 encryption
    Hashing is salted with salt configured by admin, stored in >>> model.Config

    Args:
        password (string): Plain text password

    Returns:
        string: hashed password, 64 characters

    """
    sha = hashlib.sha256()
    sha.update(password.encode('utf-8'))
    sha.update(config.CONFIG_DB.salt)
    return sha.hexdigest()


def list_to_dict(input_list):
    """Creates dictionary with keys from list values
    This function is primarily useful for converting passed data from Angular checkboxes,
     since angular ng-model can't return list of checked group of checkboxes, instead
     it returns something like {'a': True, 'b': True} for each checkbox

    Example:
        >>> list_to_dict(['a', 'b'])
        {'a': True, 'b': True}

    Args:
        input_list (list): List of any type

    Returns:
        dict: Dict with 'True' values
    """
    return _.zip_object(input_list, _.map(input_list, _.constant(True)))


def dict_to_list(input_dict):
    """Creates list from dictionary with true booloean values
    This function is primarily useful for converting passed data from Angular checkboxes,
     since angular ng-model can't return list of checked group of checkboxes, instead
     it returns something like {'a': True, 'b': True} for each checkbox

    Example:
        >>> dict_to_list({'a': True, 'b': True, 'c': False})
        ['a', 'b']

    Args:
        input_dict (dict): Dict with boolean values

    Returns:
        list: list of truthful values
    """
    return _.keys(_.pick(input_dict, _.identity))


def constrain_string(string, minlen, maxlen):
    """Validation function constrains minimal and maximal lengths of string.

    Args:
        string (string): String to be checked
        minlen (int): Minimal length
        maxlen (int): Maximal length

    Returns:
        string: Returns given string

    Raises:
        ValueError: If string doesn't fit into min/max constrains

    """

    if len(string) < minlen:
        raise ValueError('Input need to be at least %s characters long' % minlen)
    elif len(string) > maxlen:
        raise ValueError('Input need to be maximum %s characters long' % maxlen)
    return string


def constrain_regex(string, regex):
    """Validation function checks validity of string for given regex.

    Args:
        string (string): String to be checked
        regex (string): Regular expression

    Returns:
        string: Returns given string

    Raises:
        ValueError: If string doesn't match regex

    """
    regex_email = re.compile(regex, re.IGNORECASE)
    if not regex_email.match(string):
        raise ValueError('Incorrect regex format')
    return string


def create_validator(lengths=None, regex='', required=True):
    """This is factory function, which creates validator functions, which
    will then validate passed strings according to lengths or regex set at creation time

    Args:
        lengths (list): list of exact length 2. e.g [3, 7]
            indicates that string should be between 3 and 7 charactes
        regex (string): Regular expression
        required (bool): Wheter empty value '' should be accepted as valid,
            ignoring other constrains

    Returns:
        function: Function, which will be used for validating input
    """

    def validator_function(value, prop):
        """Function validates input against constraints given from closure function
        These functions are primarily used as ndb.Property validators

        Args:
            value (string): input value to be validated
            prop (string): ndb.Property name, which is validated

        Returns:
            string: Returns original string, if valid

        Raises:
            ValueError: If input isn't valid

        """
        # when we compare ndb.Property with equal operator e.g User.name == 'abc' it
        # passes arguments to validator in different order than as when e.g putting data,
        # hence the following parameters switch
        if isinstance(value, ndb.Property):
            value = prop
        if not required and value == '':
            return ''
        if regex:
            return constrain_regex(value, regex)
        return constrain_string(value, lengths[0], lengths[1])

    return validator_function

###############################################################################
# Request Parameters
###############################################################################
def param(name, cast=None):
    return None
    #value = None
    #if flask.request.json:
    #    return flask.request.json.get(name, None)

    #if value is None:
    #    value = flask.request.args.get(name, None)
    #if value is None and flask.request.form:
    #    value = flask.request.form.get(name, None)

    #if cast and value is not None:
    #    if cast is bool:
    #        return value.lower() in ['true', 'yes', 'y', '1', '']
    #    if cast is list:
    #        return value.split(',') if len(value) > 0 else []
    #    if cast is ndb.Key:
    #        return ndb.Key(urlsafe=value)
    #    return cast(value)
    #return value



###############################################################################
# Model manipulations
###############################################################################
def get_dbs(
    query, order=None, limit=None, cursor=None, keys_only=None, **filters
  ):
  limit = limit or config.DEFAULT_DB_LIMIT
  cursor = Cursor.from_websafe_string(cursor) if cursor else None
  model_class = ndb.Model._kind_map[query.kind]

  for prop in filters:
    if filters.get(prop, None) is None:
      continue
    if isinstance(filters[prop], list):
      for value in filters[prop]:
        query = query.filter(model_class._properties[prop] == value)
# new custom wodor app -------------
    elif isinstance(filters[prop], dict):
      if filters[prop]['test'] == '>':
        query = query.filter(model_class._properties[prop] > filters[prop]['value'])
      elif filters[prop]['test'] == '>=':
        query = query.filter(model_class._properties[prop] >= filters[prop]['value'])
      elif filters[prop]['test'] == '<':
        query = query.filter(model_class._properties[prop] < filters[prop]['value'])
      elif filters[prop]['test'] == '<=':
        query = query.filter(model_class._properties[prop] < filters[prop]['value'])
      elif filters[prop]['test'] == '==':
        query = query.filter(model_class._properties[prop] == filters[prop]['value'])
      elif filters[prop]['test'] == '!=':
        query = query.filter(model_class._properties[prop] != filters[prop]['value'])
      elif filters[prop]['test'] == 'IN':
        values = filters[prop]['value']
        if isinstance(values, list):
          values = filters[prop]['value']
        else:
           values = values.split(',')
        query = query.filter(model_class._properties[prop].IN(values))
        query = query.order(model_class._key)
      query = query.order(model_class._properties[prop]) # TODO does it work?
    else:
      query = query.filter(model_class._properties[prop] == filters[prop])
# ----------------------------------

  if order:
    for o in order.split(','):
      if o.startswith('-'):
        query = query.order(-model_class._properties[o[1:]])
      else:
        query = query.order(model_class._properties[o])
  model_dbs, next_cursor, more = query.fetch_page(
      limit, start_cursor=cursor, keys_only=keys_only,
    )
  next_cursor = next_cursor.to_websafe_string() if more else None
  return list(model_dbs), next_cursor



def sort_uniq(sequence,key_sort=None,key_group=None,reverse=False):
    sorted_seq = list(sorted(sequence,key=operator.itemgetter(key_sort), reverse=reverse))
    #return sorted_seq
    uniq_seq = {v[key_group]:v for v in sorted_seq}.values()
    return list(sorted(uniq_seq,key=operator.itemgetter(key_sort), reverse=not reverse))



