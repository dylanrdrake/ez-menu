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
