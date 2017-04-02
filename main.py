# -*- coding: utf-8 -*-

# Import the Flask Framework
from flask import Flask,url_for,redirect,request,render_template,jsonify,g,session
# Oauth imports
from flask_oauth import OAuth
# Necessary packages
from urllib2 import Request, urlopen, URLError
import MySQLdb as mysql
import json
import os
from env_config import creds, google_auth_env
from functools import wraps



# Note: Don't need to call run() since our application is embedded within
# the App Engine WSGI application server.



# Google auth setup
app = Flask(__name__)
app.debug = True
app.secret_key = 'development key'
oauth = OAuth()
google = oauth.remote_app('google',
        base_url=google_auth_env['base_url'],
        authorize_url=google_auth_env['authorize_url'],
        request_token_url=google_auth_env['request_token_url'],
        request_token_params=google_auth_env['request_token_params'],
        access_token_url=google_auth_env['access_token_url'],
        access_token_method=google_auth_env['access_token_method'],
        access_token_params=google_auth_env['access_token_params'],
        consumer_key=google_auth_env['consumer_key'],
        consumer_secret=google_auth_env['consumer_secret'])




# Run this before every route
def auth_check(route):
    @wraps(route)
    def route_wrapper(*args, **kwargs):
        
        access_token = session.get('access_token')
        if access_token is None:
            return redirect(url_for('logout'))

        access_token = access_token[0]
        from urllib2 import Request, urlopen, URLError

        headers = {'Authorization': 'OAuth '+access_token}
        req = Request('https://www.googleapis.com/oauth2/v1/userinfo',
                None, headers)
        
        # Get user info from Google
        try:
            res = urlopen(req)
        except URLError, e:
            if e.code == 401:
                # Unauthorized - bad token
                session.pop('access_token', None)
                return redirect(url_for('logout'))
            return res.read()

        user_info = json.loads(res.read())
        # update session with user_info
        session['user_email'] = user_info['email']
        session['user_name'] = user_info['name']
        session['user_pic'] = user_info['picture']


        if session.get('user_email') != None:
            user_email = session.get('user_email')
        else:
            return redirect(url_for('logout'))


        return route(*args, **kwargs)

    return route_wrapper



@app.route(creds['REDIRECT_URI'])
@google.authorized_handler
def authorized(resp):
    access_token = resp['access_token']
    session['access_token'] = access_token, ''
    return redirect(url_for('index'))



@google.tokengetter
def get_access_token():
    return session.get('access_token')



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
        #                        user=creds['dbuser'],
        #                        passwd=creds['dbpass'])
        # OR
        # you can just use the parameters of your cloud sql instance
        g.conn = mysql.connect(host=creds['dbhost'],
                               db=creds['dbbase'],
                               user=creds['dbuser'],
                               passwd=creds['dbpass'])



@app.teardown_request
def db_disconnect(exception):
    g.conn.close()



@app.route('/login_screen')
def login_screen(message=None):
    if request.args.get('message'):
        message = request.args.get('message')
    return render_template('login.html',
            message=message)



@app.route('/login')
def login():
    callback=url_for('authorized', _external=True)
    return google.authorize(callback=callback)



@app.route('/logout')
def logout(message=None):
    session.clear()
    if request.args.get('message'):
        message = request.args.get('message')
    return redirect(url_for('login_screen',
            message=message))




@app.route('/')
@auth_check
def index():
    user_email = session.get('user_email')
    user_query = """
    SELECT MenuTitle,PublicLink,ColorScheme,ShareWith
    FROM menus
    WHERE Email='{0}'
    """.format(user_email)
    user_query_cur = g.conn.cursor()
    user_query_cur.execute(user_query)
    user_query_results = user_query_cur.fetchall()
    user_query_columns = user_query_cur.description
    user_query_cur.close()

    columns = [col_data[0] for col_data in user_query_columns]
    results = [{col: data for col,data in zip(columns,result)}\
            for result in user_query_results]

    return render_template('home.html',
                           results=results)
    








@app.errorhandler(404)
@auth_check
def page_not_found(e):
    #Return a custom 404 error
    return 'Sorry, Nothing at this URL.', 404


@app.errorhandler(500)
@auth_check
def application_error(e):
    #Return a custom 500 error
    return 'Application Error" '+str(e)+'\n\nShow this error to Admin'
