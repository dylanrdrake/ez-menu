#-*- coding: utf-8 -*-

# imports
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


# Create a connection to database before every request
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


# Returns lastrowid if commiting changes
# Returns results if querying data
def query_db(sql_query, params, commit):
    params = tuple(params)
    cursor = g.conn.cursor()
    cursor.execute(sql_query, params)
    raw_results = cursor.fetchall()
    column_data = cursor.description
    cursor.close()
    if commit:
        g.conn.commit()
        return cursor.lastrowid
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
    if getuser(claims.get('user_id')):
        update_user(userid=claims.get('user_id'),
                    provider=claims.get('firebase')['sign_in_provider'],
                    name=claims.get('name'),
                    email=claims.get('email'),
                    picture=claims.get('picture'))
    elif not getuser(claims.get('user_id')):
        create_user(userid=claims.get('user_id'),
                    provider=claims.get('firebase')['sign_in_provider'],
                    name=claims.get('name'),
                    email=claims.get('email'),
                    picture=claims.get('picture'))

    return claims.get('user_id')



# Get User
def getuser(userid):
    user_query = """
    SELECT * FROM Users
    WHERE UserId = %s
    """
    userdata = query_db(user_query, [userid], False)
    if len(userdata) > 0:
        userdata = userdata[0]
        tempdata = getusertemplates(userid)
        userdata['Templates'] = tempdata
        return userdata
    else:
        return False


# Create User
def create_user(userid, provider, name=None, email=None, picture=None):
    create_user_sql = """
    INSERT INTO Users
    (UserId, AuthProvider, Name, Email, Picture)
    VALUES (%s, %s, %s, %s, %s)
    """
    value_params = [userid, provider, name, email, picture]
    query_db(create_user_sql, value_params, True)

    user_temp_sql = """
    INSERT INTO user_templates
    (UserId, TemplateId)
    VALUES (%s, %s)
    """
    value_params = [userid, '1001112224']
    query_db(user_temp_sql, value_params, True)


# Update User
def update_user(userid, provider, name=None, email=None, picture=None):
    update_user_sql = """
    UPDATE Users
    SET AuthProvider=%s,
        Name=%s,
        Email=%s,
        Picture=%s
    WHERE UserId=%s
    """
    value_params = [provider, name, email, picture, userid]
    query_db(update_user_sql, value_params, True)


# Create item
def createitem(sectid, itemdata):
    for item in itemdata:
        del item['ItemId']
        item['SectionId'] = sectid
        create_item_sql = "INSERT INTO items "
        fields = [field for field in item.iterkeys()]
        create_item_sql += "("+(",").join(fields)+") "
        values = ["%s"] * len(item)
        create_item_sql += "VALUES ("+(",").join(values)+")"
        value_params = [value for key,value in item.iteritems()]
        query_db(create_item_sql, value_params, True)


# Create section
def createsect(menuid, sectdata):
    for sect in sectdata:
        if 'Items' in sect:
            items = sect.pop('Items')

        del sect['SectionId']
        sect['MenuId'] = menuid
        create_sect_sql = "INSERT INTO sections "
        fields = [field for field in sect.iterkeys()]
        create_sect_sql += "("+(",").join(fields)+") "
        values = ["%s"] * len(sect)
        create_sect_sql += "VALUES ("+(",").join(values)+")"
        value_params = [value for key,value in sect.iteritems()]
        sectid = query_db(create_sect_sql, value_params, True)

        if 'items' in locals():
            updateitem(sectid, items)


# Create menu
def createmenu(userid, menudata):
    for menu in menudata:
        if 'Sections' in menu:
            sects = menu.pop('Sections')

        create_menu_sql = "INSERT INTO menus "
        fields = [field for field in menu.iterkeys()]
        create_menu_sql += "("+(",").join(fields)+") "
        values = ["%s"] * len(menu)
        create_menu_sql += "VALUES ("+(",").join(values)+")"
        value_params = [value for key,value in menu.iteritems()]
        menuid = query_db(create_menu_sql, value_params, True)

        if 'sects' in locals():
            updatesect(menuid, sects)

        user_menu_sql = """
        INSERT INTO user_menus
        (UserId, MenuId)
        VALUES (%s, %s)
        """
        user_menu_params = [userid, menuid]
        query_db(user_menu_sql, user_menu_params, True)



# Update item
def updateitem(sectid, itemdata):
    for item in itemdata:
        if item['_DELETE_'] == 'true' and item['ItemId'] != '':
            deleteitem( [{'ItemId': item['ItemId']}] )
        elif item['ItemId'] == '' and item['_DELETE_'] != 'true':
            createitem(sectid, [item])
        elif item['_DELETE_'] != 'true':
            itemid = item.pop('ItemId')
            update_item_sql = "UPDATE items "
            updates = [field+"=%s" for field in item.iterkeys()]
            update_item_sql += "SET "+(",").join(updates)+" "
            update_item_sql += "WHERE ItemId=%s"
            value_params = [value for key,value in item.iteritems()]
            value_params.append(itemid)
            query_db(update_item_sql, value_params, True)


# Update section
def updatesect(menuid, sectdata):
    for sect in sectdata:
        if sect['_DELETE_'] == 'true' and sect['SectionId'] != '':
            deletesect( [{'SectionId': sect['SectionId']}] )
        elif sect['SectionId'] == '' and sect['_DELETE_'] != 'true':
            sectid = createsect(menuid, [sect])
        elif sect['_DELETE_'] != 'true':
            sectid = sect.pop('SectionId')
            if 'Items' in sect:
                items = sect.pop('Items')
                updateitem(sectid, items)

            update_sect_sql = "UPDATE sections "
            updates = [field+"=%s" for field in sect.iterkeys()]
            update_sect_sql += "SET "+(",").join(updates)+" "
            update_sect_sql += "WHERE SectionId=%s"
            value_params = [value for key,value in sect.iteritems()]
            value_params.append(sectid)
            query_db(update_sect_sql, value_params, True)



# Update menu
def updatemenu(menudata):
    for menu in menudata:
        menuid = menu.pop('MenuId')
        dbdata = getmenu(menuid)

        # Update sections
        if 'Sections' in menu:
            sects = menu.pop('Sections')
            updatesect(menuid, sects)

        # Update database
        if 'Publish' in menu and menu['Publish'] == True:
            menu['PublicLink'] = 'https://storage.googleapis.com/'\
                    +bucket+'/menus/'+menuid+'.html'
            menu['Publish'] = 'true'
        elif 'Publish' in menu and menu['Publish'] == False:
            menu['PublicLink'] = None
            menu['Publish'] = 'false'
        elif dbdata['Publish'] == 'true':
            menu['PublicLink'] = 'https://storage.googleapis.com/'\
                    +bucket+'/menus/'+menuid+'.html'
            menu['Publish'] = 'true'

        if len(menu) != 0:
            update_menu_sql = "UPDATE menus "
            updates = [field+"=%s" for field in menu.iterkeys()]
            update_menu_sql += "SET "+(",").join(updates)+" "
            update_menu_sql += "WHERE MenuId=%s"
            value_params = [value for key,value in menu.iteritems()]
            value_params.append(menuid)
            print value_params
            query_db(update_menu_sql, value_params, True)

        # Update Storage object
        if 'Publish' in menu and menu['Publish'] == 'true':
            publiclink = publishmenu(menuid)
        elif 'Publish' in menu and menu['Publish'] == 'false':
            takedownmenu(menuid)
        elif dbdata['Publish'] == 'true':
            publiclink = publishmenu(menuid)



# Delete menu
def deletemenu(userid, menudata):
    for menu in menudata:
        delete_menu_sql = """
        DELETE FROM user_menus
        WHERE UserId=%s
        AND MenuId=%s
        """
        value_params = [userid, menu['MenuId']]
        query_db(delete_menu_sql, value_params, True)


# Delete section
def deletesect(sectdata):
    for sect in sectdata:
        delete_sect_sql = """
        UPDATE sections
        SET MenuId=NULL
        WHERE SectionId=%s
        """
        value_params = [sect['SectionId']]
        query_db(delete_sect_sql, value_params, True)


# Delete item
def deleteitem(itemdata):
    for item in itemdata:
        delete_item_sql = """
        UPDATE items
        SET SectionId=NULL
        WHERE ItemId=%s
        """
        value_params = [item['ItemId']]
        query_db(delete_item_sql, value_params, True)


# Get Menu
def getmenu(menuid):
    menu_query = """
    SELECT * FROM menus
    WHERE MenuId=%s
    """
    value_params = [menuid]
    menudata = query_db(menu_query, value_params, False)[0]

    sect_query = """
    SELECT * FROM sections
    WHERE MenuId=%s
    """
    value_params = [menuid]
    sections = query_db(sect_query, value_params, False)

    menudata['Sections'] = []

    for sect in sections:
        item_query = """
        SELECT * FROM items
        WHERE SectionId=%s
        """
        value_params = [sect['SectionId']]
        itemdata = query_db(item_query, value_params, False)
        sect['Items'] = itemdata
        menudata['Sections'].append(sect)

    return menudata


# Get User's menus
def getusermenus(userid):
    menus_query = """
    SELECT * FROM user_menus
    WHERE UserId=%s
    """
    value_params = [userid]
    usermenus = query_db(menus_query, value_params, False)

    menudata = []

    for menu in usermenus:
        menuresp = getmenu(menu['MenuId'])
        menudata.append(menuresp)

    return menudata


# Get User's tempaltes
def getusertemplates(userid):
    temp_query = """
    SELECT * FROM user_templates
    WHERE UserId=%s
    """
    value_params = [userid]
    usertemps = query_db(temp_query, value_params, False)

    usertemplates = []

    for temp in usertemps:
        temp_query = """
        SELECT * FROM templates
        WHERE TemplateId=%s
        """
        value_params = [temp['TemplateId']]
        tempdata = query_db(temp_query, value_params, False)[0]
        usertemplates.append(tempdata)

    return usertemplates



# Get template
def gettemplate(tempid):
    temp_query = """
    SELECT * FROM templates
    WHERE TemplateId=%s
    """
    value_params = [tempid]
    tempdata = query_db(temp_query, value_params, False)[0]

    return tempdata



# Publish Menu
def publishmenu(menuid):
    menudata = getmenu(menuid)

    tempdata = gettemplate(menudata['Template'])

    menuHTML = render_template(tempdata['TemplateFile'],
                               menu=menudata)

    object = '/'+bucket+'/menus/'+menuid+'.html'

    write_retry_params = gcs.RetryParams(backoff_factor=1.1)
    with gcs.open(object,
                  'w',
                  content_type='text/html',
                  options={'x-goog-acl': 'public-read',
                           'Cache-Control': 'no-cache'},
                  retry_params=write_retry_params) as menu_file:
        menu_file.write(str(menuHTML))
        menu_file.close()

    menu_link = 'https://storage.googleapis.com/'+bucket+'/menus/'\
            +menuid+'.html'

    return menu_link


# Take down menu
def takedownmenu(menuid):
    object = '/'+bucket+'/menus/'+menuid+'.html'
    gcs.delete(object)



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
        # with a specific MenuId in the request
        # data to get the specific menu
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
