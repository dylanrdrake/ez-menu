import main
from userdata import getmenu
from db import query_db
from flask import request
import google.oauth2.id_token

# Check Authorization
def auth_check(request):
    # Verify Firebase auth.
    id_token = request.headers['Authorization'].split(' ').pop()
    claims = google.oauth2.id_token.verify_firebase_token(
        id_token, main.HTTP_REQUEST)
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
