from db import query_db
from storage import bucket
from template import gettemplate
from flask import render_template
import cloudstorage as gcs
from datetime import datetime


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


# Returns boolean that determines
# whether user has shared access to menu
# (menu has been shared with user by owner)
#def canuseredit(userid, menuid):
#    return True


# Returns boolean that determines whether user owns menu
# (User created menu)
def isuserowner(userid, menuid):
    usersmenus = getusermenus(userid)
    menuids = [menu['MenuId'] for menu in usersmenus]
    if int(menuid) in menuids:
        return True
    else:
        return False


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



# Update item
def updateitem(sectid, item):
    if item['_DELETE_'] == 'true':
        deleteitem( {'ItemId': item['ItemId']} )
    else:
        item = {key: val for key,val in item.iteritems()\
                if val != ''}
        item['SectionId'] = sectid
        update_item_sql = "INSERT INTO items "
        fields = [field for field in item.iterkeys()]
        update_item_sql += "(" + (",").join(fields)+" ) "
        value_params = [value for key,value in item.iteritems()]
        placeholders = ["%s" for value in value_params]
        update_item_sql += "VALUES (" + \
                            (",").join(placeholders) + ") "
        update_item_sql += "ON DUPLICATE KEY UPDATE "
        updates = [field+"=%s" for field in item.iterkeys()]
        update_item_sql += (",").join(updates)
        value_params = value_params + value_params
        query_db(update_item_sql, value_params, True)


# Update section
def updatesect(menuid, sect):
    if sect['_DELETE_'] == 'true':
        deletesect( {'SectionId': sect['SectionId']} )
    else:
        if 'Items' in sect:
            for item in sect.pop('Items'):
                updateitem(sect['SectionId'], item)

        sect = {key: val for key,val in sect.iteritems()\
                if val != ''}
        sect['MenuId'] = menuid
        update_sect_sql = "INSERT INTO sections "
        fields = [field for field in sect.iterkeys()]
        update_sect_sql += "(" + (",").join(fields)+" ) "
        value_params = [value for key,value in sect.iteritems()]
        placeholders = ["%s" for value in value_params]
        update_sect_sql += "VALUES (" + \
                            (",").join(placeholders) + ") "
        update_sect_sql += "ON DUPLICATE KEY UPDATE "
        updates = [field+"=%s" for field in sect.iterkeys()]
        update_sect_sql += (",").join(updates)
        value_params = value_params + value_params
        query_db(update_sect_sql, value_params, True)



# Update menu
def updatemenu(menu):
    menuid = menu.pop('MenuId')
    dbdata = getmenu(menuid)

    # Update sections
    if 'Sections' in menu:
        for sect in menu.pop('Sections'):
            updatesect(menuid, sect)

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
        query_db(update_menu_sql, value_params, True)

    # Update Storage object
    if 'Publish' in menu and menu['Publish'] == 'true':
        publiclink = publishmenu(menuid)
    elif 'Publish' in menu and menu['Publish'] == 'false':
        takedownmenu(menuid)
    elif dbdata['Publish'] == 'true':
        publiclink = publishmenu(menuid)

    returndata = getmenu(menuid)

    return returndata


# Create menu
def createmenu(userid, menu):
    if 'Sections' in menu:
        for sect in menu.pop('Sections'):
            updatesect(menuid, sect)

    create_menu_sql = "INSERT INTO menus "
    fields = [field for field in menu.iterkeys()]
    create_menu_sql += "("+(",").join(fields)+") "
    values = ["%s"] * len(menu)
    create_menu_sql += "VALUES ("+(",").join(values)+")"
    value_params = [value for key,value in menu.iteritems()]
    menuid = query_db(create_menu_sql, value_params, True)

    user_menu_sql = """
    INSERT INTO user_menus
    (UserId, MenuId)
    VALUES (%s, %s)
    """
    user_menu_params = [userid, menuid]
    query_db(user_menu_sql, user_menu_params, True)



# Delete menu
def deletemenu(userid, menu):
    dbmenudata = getmenu(menu['MenuId'])
    delete_menu_sql = """
    DELETE FROM user_menus
    WHERE UserId=%s
    AND MenuId=%s
    """
    value_params = [userid, menu['MenuId']]
    query_db(delete_menu_sql, value_params, True)

    if dbmenudata['PublicLink'] is not None:
        deletemenublob(menu['MenuId'])


# Delete section
def deletesect(sect):
    delete_sect_sql = """
    UPDATE sections
    SET MenuId=NULL
    WHERE SectionId=%s
    """
    value_params = [sect['SectionId']]
    query_db(delete_sect_sql, value_params, True)


# Delete item
def deleteitem(item):
    delete_item_sql = """
    UPDATE items
    SET SectionId=NULL
    WHERE ItemId=%s
    """
    value_params = [item['ItemId']]
    query_db(delete_item_sql, value_params, True)


# Is menu published
def ismenupublished(menuid):
    ispub_query = """
    SELECT Publish FROM menus
    WHERE MenuId=%s"""
    value_params = [menuid]
    ispublished = query_db(ispub_query, value_params, False)[0]
    if ispublished == 'true':
        return True
    else:
        return False


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


# Publish Menu
def publishmenu(menuid):
    menudata = getmenu(menuid)

    tempdata = gettemplate(menudata['Template'])

    menuHTML = render_template(tempdata['TemplateFile'],
                               menu=menudata)

    object = '/'+bucket+'/menus/'+menuid+'.html'

    last_change = datetime.utcnow().strftime('%y-%m-%dT%H:%M:%S%f')

    write_retry_params = gcs.RetryParams(backoff_factor=1.1)
    with gcs.open(object,
                  'w',
                  content_type='text/html',
                  options={'x-goog-acl': 'public-read',
                           'Cache-Control': 'no-cache',
                           'x-goog-meta-last-change': last_change},
                  retry_params=write_retry_params) as menu_file:
        menu_file.metadata = {'last-change': last_change}
        menu_file.write(str(menuHTML))
        menu_file.close()

    menu_link = 'https://storage.googleapis.com/'+bucket+'/menus/'\
            +menuid+'.html'

    return menu_link



# Take down menu
def takedownmenu(menuid):
    menudata = getmenu(menuid)

    maintHTML = render_template("maintenance.html",
                                menu=menudata)

    object = '/'+bucket+'/menus/'+menuid+'.html'

    write_retry_params = gcs.RetryParams(backoff_factor=1.1)
    with gcs.open(object,
                  'w',
                  content_type='text/html',
                  options={'x-goog-acl': 'public-read',
                           'Cache-Control': 'no-cache'},
                  retry_params=write_retry_params) as menu_file:
        menu_file.write(str(maintHTML))
        menu_file.close()



def deletemenublob(menuid):
    object = '/'+bucket+'/menus/'+menuid+'.html'
    gcs.delete(object)
