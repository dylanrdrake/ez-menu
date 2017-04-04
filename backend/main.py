#-*- coding: utf-8 -*-

# 
import logging
from flask import Flask,request,url_for,redirect,render_template,g,jsonify
import flask_cors
import google.auth.transport.requests
import google.oauth2.id_token
import requests_toolbelt.adapters.appengine
# CloudSQL
import os
import MySQLdb as mysql
from env_config import creds
# Storage
import cloudstorage as gcs
from google.appengine.api import app_identity

# Use the App Engine Requests adapter. This makes sure that Requests uses
# URLFetch.
requests_toolbelt.adapters.appengine.monkeypatch()
HTTP_REQUEST = google.auth.transport.requests.Request()

app = Flask(__name__)
# allows Ajax
flask_cors.CORS(app)


@app.before_request
def db_connect():
    if (os.getenv('SERVER_SOFTWARE') and \
            os.getenv('SERVER_SOFTWARE').startswith('Google App Engine/')):
        g.conn = mysql.connect(unix_socket='/cloudsql/'+creds['_INSTANCE_NAME'],
                               db=creds['dbbase'],
                               user=creds['dbuser'],
                               passwd=creds['dbpass'])
    else:
        # this is the database used when running dev_appserver.py
        # install cloud_sql_proxy.py as described in google's docs
        # g.conn = mysql.connect(host='127.0.0.1',
        #                        db=creds['dbbase'],
        #                        user=creds['dbuser'],
        #                        passwd=creds['dbpass'])
        # OR
        # you can just include the host ip of your cloud sql instance
        g.conn = mysql.connect(host=creds['dbhost'],
                               db=creds['dbbase'],
                               user=creds['dbuser'],
                               passwd=creds['dbpass'])


@app.teardown_request
def db_disconnect(exception):
    g.conn.close()



# [START add_note]
@app.route('/menus', methods=['GET'])
def menus():

    # Verify Firebase auth.
    id_token = request.headers['Authorization'].split(' ').pop()
    claims = google.oauth2.id_token.verify_firebase_token(
        id_token, HTTP_REQUEST)
    if not claims:
        return 'Unauthorized', 401

    user_email = claims.get('email')

    print user_email
    print claims['sub']

    return











@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
# [END app]
