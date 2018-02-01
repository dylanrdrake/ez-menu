#-*- coding: utf-8 -*-

# imports
import logging
from flask import Flask, g, request, url_for, redirect, jsonify
import flask_cors
import json
# CloudSQL
import os
import MySQLdb as mysql
from env_config import creds
# /backend
from auth import auth_check
from user import getuser, getusermenus,\
    getmenu, createmenu, updatemenu, deletemenu


# Initialize app
app = Flask(__name__)
# allows Ajax
flask_cors.CORS(app)


# Create a connection to database before every request
@app.before_request
def db_connect():
    if (os.getenv('SERVER_SOFTWARE') and \
            os.getenv('SERVER_SOFTWARE')
              .startswith('Google App Engine/')):
        g.conn = mysql.connect(unix_socket='/cloudsql/'+
                               creds['_INSTANCE_NAME'],
                               db=creds['dbbase'],
                               user=creds['dbuser'],
                               passwd=creds['dbpass'])
    else:
        # this is the database used when running dev_appserver.py
        g.conn = mysql.connect(host=creds['dbhost'],
                               db=creds['dbbase'],
                               user=creds['dbuser'],
                               passwd=creds['dbpass'])


# Destroy db connection on request teardown
@app.teardown_request
def db_disconnect(exception):
    g.conn.close()



# API endpoint: /menus
@app.route('/menus', methods=['GET', 'POST', 'PUT', 'DELETE'])
def menus():
    userid = auth_check(request)

    if request.method == 'GET':
        # a /menus GET request can be made
        # with a specific MenuId in the request
        # data to get the specific menu's data
        if request.args:
            menudata = getmenu(request.args.get('MenuId'))
            return jsonify(menudata), 200
        # if /menus GET request is made without
        # data, the submitting user's menus
        # are returned
        else:
            usermenus = getusermenus(userid)
            return jsonify(usermenus), 200

    elif request.method == 'POST':
        createmenu(userid, json.loads(request.data))
        return 'Menu created', 200

    elif request.method == 'PUT':
        returndata = updatemenu(userid, json.loads(request.data))
        return jsonify(returndata), 200

    elif request.method == 'DELETE':
        deletemenu(userid, json.loads(request.data))
        return 'Menus deleted', 200

    else:
        return 'Bad request', 400



# API endpoint: /users
@app.route('/users', methods=['GET'])
def users():
    userid = auth_check(request)

    if request.method == 'GET':
        userdata = getuser(userid)
        return jsonify(userdata), 200

    else:
        return 'Bad request', 400



@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
# [END app]
