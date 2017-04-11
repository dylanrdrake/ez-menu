#-*- coding: utf-8 -*-

# 
import logging
from flask import Flask,request,url_for,redirect,render_template,g,jsonify
import flask_cors
import google.auth.transport.requests
import google.oauth2.id_token
import requests_toolbelt.adapters.appengine
from datetime import datetime
import json
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

# Get Storage bucket
bucket = os.environ.get('BUCKET_NAME',
        app_identity.get_default_gcs_bucket_name())



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
        g.conn = mysql.connect(host=creds['dbhost'],
                               db=creds['dbbase'],
                               user=creds['dbuser'],
                               passwd=creds['dbpass'])


@app.teardown_request
def db_disconnect(exception):
    g.conn.close()



# Query Database
def query_db(sql_query, commit):
    cursor = g.conn.cursor()
    cursor.execute(sql_query)
    raw_results = cursor.fetchall()
    column_data = cursor.description
    cursor.close()
    if commit:
        g.conn.commit()
        return True
    else:
        columns = [col[0] for col in column_data]
        results = [{col: data for col,data in zip(columns,result)}\
                for result in raw_results]
        return results



# Check Authorization
def auth_check(request):
    # Verify Firebase auth.
    id_token = request.headers['Authorization'].split(' ').pop()
    claims = google.oauth2.id_token.verify_firebase_token(
        id_token, HTTP_REQUEST)
    if not claims:
        return 'Unauthorized', 401

    # Update User or Create User if none exists
    if get_user(claims.get('user_id')):
        update_user(userid=claims.get('user_id'),
                    provider=claims.get('firebase')['sign_in_provider'],
                    name=claims.get('name'),
                    email=claims.get('email'),
                    picture=claims.get('picture'))
    elif not get_user(claims.get('user_id')):
        create_user(userid=claims.get('user_id'),
                    provider=claims.get('firebase')['sign_in_provider'],
                    name=claims.get('name'),
                    email=claims.get('email'),
                    picture=claims.get('picture'))
    
    return claims.get('user_id')



# Get User
def get_user(userid):
    user_query = """
    SELECT * FROM Users
    WHERE UserId = '{0}'
    """.format(userid)
    user_data = query_db(user_query, False)[0]
    return user_data


# Create User
def create_user(userid, provider, name=None, email=None, picture=None):
    create_user_sql = """
    INSERT INTO Users
    (UserId, AuthProvider, Name, Email, Picture)
    VALUES ('{0}', '{1}', '{2}', '{3}', '{4}')
    """.format(userid, provider, name, email, picture)
    query_db(create_user_sql, True)


# Update User
def update_user(userid, provider, name=None, email=None, picture=None):
    update_user_sql = """
    UPDATE Users
    SET AuthProvider='{0}',
        Name='{1}',
        Email='{2}',
        Picture='{3}'
    WHERE UserId='{4}'
    """.format(provider, name, email, picture, userid)
    query_db(update_user_sql, True)


# Create item
def createitem(menuid, itemdata):
    itemdata['MenuId'] = menuid
    for item in itemdata:
        create_item_sql = "INSERT INTO items "
        fields = [field for field in item.iterkeys()]
        create_item_sql += "("+(",").join(fields)+") "
        values = ["'"+value+"'" for value in item.itervalues()]
        create_item_sql += "VALUES ("+(",").join(values)+")"
        query_db(create_item_sql, True)


# Create menu
def createmenu(userid, menudata):
    for menu in menudata:
        menu['MenuId'] = datetime.utcnow().strftime('%y%m%d%H%M%S%f')
        menu['Owner'] = userid
        create_menu_sql = "INSERT INTO menus "
        fields = [field for field in menu.iterkeys()]
        create_menu_sql += "("+(",").join(fields)+") "
        values = ["'"+value+"'" for value in menu.itervalues()]
        create_menu_sql += "VALUES ("+(",").join(values)+")"
        query_db(create_menu_sql, True)

        if 'Items' in menu:
            createitem(menu['MenuId'], menu['Items'])


# Update item
def updateitem(itemdata):
    for item in itemdata:
        itemid = item.pop('ItemId')
        update_item_sql = "UPDATE items "
        updates = [field+"='"+value+"'" for field,value in item.iteritems()]
        update_item_sql += "SET "+(",").join(updates)+" "
        update_item_sql += "WHERE ItemId='"+itemid+"'" 
        query_db(update_item_sql, True)


# Update menu
def updatemenu(menudata):
    for menu in menudata:
        menuid = menu.pop('MenuId')
        
        if 'Items' in menu:
            items = menu.pop('Items')
            updateitem(items)
        if 'Publish' in menu:
            publish = menu.pop('Publish')
        if 'Takedown' in menu:
            takedown = menu.pop('Takedown')

        if len(menu) != 0:
            update_menu_sql = "UPDATE menus "
            updates = [field+"='"+value+"'" if value != None else field+"=NULL"\
                    for field,value in menu.iteritems()]
            update_menu_sql += "SET "+(",").join(updates)+" "
            update_menu_sql += "WHERE MenuId='"+menuid+"'"
            query_db(update_menu_sql, True)

        if 'publish' in locals():
            publishmenu(menuid)
        if 'takedown' in locals():
            takedownmenu(menuid)



# Delete menu
def deletemenu(menudata):
    for menu in menudata:
        delete_menu_sql = """
        DELETE FROM menus WHERE MenuId='{0}'
        """.format(menu['MenuId'])
        query_db(delete_menu_sql, True)

        delete_items_sql = """
        DELETE FROM items WHERE MenuId='{0}'
        """.format(menu['MenuId'])
        query_db(delete_items_sql, True)


# Delete item
def deleteitem(itemdata):
    for item in itemdata:
        delete_item_sql = """
        DELETE FROM items WHERE ItemId='{0}'
        """.format(item['ItemId'])
        query_db(delete_item_sql, True)


# Get Menu
def getmenu(menuid):
    menu_query = """
    SELECT * FROM menus
    WHERE MenuId={0}
    """.format(menuid)
    menudata = query_db(menu_query, False)[0]

    item_query = """
    SELECT * FROM items
    WHERE MenuId='{0}'
    """.format(menuid)
    itemdata = query_db(item_query, False)

    menudata['Items'] = itemdata
    return menudata


# Get User's menus
def getusermenus(userid):
    menus_query = """
    SELECT * FROM menus
    WHERE Owner='{0}'
    """.format(userid)
    menusdata = query_db(menus_query, False)
    return menusdata


# Publish Menu
def publishmenu(menuid):
    menudata = getmenu(menuid)

    menuHTML = render_template('menu_template.html',
                               menu_data=menudata)

    object = '/'+bucket+'/menus/'+menuid+'.html'

    write_retry_params = gcs.RetryParams(backoff_factor=1.1)
    with gcs.open(object,
                  'w',
                  content_type='text/html',
                  options={'x-goog-acl': 'public-read'},
                  retry_params=write_retry_params) as menu_file:
        menu_file.write(str(menuHTML))
        menu_file.close()
 
    menu_link = 'https://storage.googleapis.com/ez-menu.appspot.com/menus/'\
            +menuid+'.html'

    update_data = [
            {'MenuId': menuid,
             'PublicLink': menu_link
            }
    ]
    updatemenu(update_data)

    return menu_link


# Take down menu
def takedownmenu(menuid):
    object = '/'+bucket+'/menus/'+menuid+'.html'
    gcs.delete(object)

    update_data = [
            {'MenuId': menuid,
             'PublicLink': None
            }
    ]
    updatemenu(update_data)



# API endpoint: /menus
@app.route('/menus', methods=['GET', 'POST', 'PUT', 'DELETE'])
def menus():
    userid = auth_check(request)

    if request.method == 'GET':
        # if /menus GET request is made without
        # data, the submitting user's menus
        # are returned
        if request.args:
            menudata = getmenu(request.args.get('MenuId'))
            return jsonify(menudata), 200
        # a /menus GET request can be made 
        # with specific MenuIds in the request
        # data to get specific menus
        else:
            usermenus = getusermenus(userid)
            return jsonify(usermenus), 200

    elif request.method == 'POST':
        createmenu(userid, json.loads(request.data))
        return 'Menu created', 200

    elif request.method == 'PUT':
        updatemenu(json.loads(request.data))
        return 'Menu updated', 200

    elif request.method == 'DELETE':
        deletemenu(json.loads(request.data))
        return 'Menu deleted', 200

    else:
        return 'Bad request', 400
 




@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
# [END app]
