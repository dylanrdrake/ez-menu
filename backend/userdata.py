from db import query_db

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
def updatemenu(userid, menudata):
    for menu in menudata:
        menuid = menu.pop('MenuId')
        isowner = isuserowner(userid, menuid)
        if isowner == False:
            continue
        elif isowner == True:
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
        dbmenudata = getmenu(menu['MenuId'])
        isowner = isuserowner(userid, menu['MenuId'])
        if isowner == False:
            continue
        elif isowner == True:
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
