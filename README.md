# EZ Menu
[ez-menu.appspot.com](https://ez-menu.appspot.com/)

<<<<<<< HEAD
# About
This app started as a restaurant menu creator used to create and publish menus to public links that could then be accessed by customers, embedded in websites and displayed on in-store monitors via a RaspberryPi. It is currently being used as is by 1 restaurant. I am now working on extending it to further use cases. The ability to create standalone objects/sites with their own public links creates a lot of opportunities.

Currently it is simple menu making application that stores User data and menu data in a MySQL database and publishes menus to public objects on Google Storage. These menus include there own javascript and css in-file and can be embedded in other sites or accessed via other devices and behave consistently. Uses Firebase
=======
[ez-menu.appspot.com](https://ez-menu.appspot.com/)

# About
This app started as a restaurant menu creator used to create and publish menus to public links that could then be accessed by customers, embedded in websites and displayed on in-store monitors via a RaspberryPi. It is currently being used as is by 1 restaurant. I am now working on extending it to further use cases. The ability to create standalone objects with their own public links creates a lot of opportunities.  

Currently it is a simple menu making application that stores User data and menu data in a MySQL database and publishes menus to public objects on Google Storage. Uses Firebase
>>>>>>> 036b9ef66be65eac371d8ee772fea1f99619d6c8
Authentication, Google App Engine, Google Cloud SQL and Google Storage.

You'll need to have [Python 2.7](https://www.python.org/) and the [Google Cloud SDK](https://cloud.google.com/sdk/?hl=en)
installed and initialized to an App Engine project before running the code in
this sample.

## Setup

1. Clone this repo:

        git clone https://github.com/dylanrdrake/ez-menu.git

1. Navigate to the backend directory:

        cd ez-menu/backend

1. Install the 3rd-party dependencies to the backend service:

        pip install -t lib/ -r requirements.txt

    if you get python3 print statement error, remove * in lib/, install pip2.7 and:

        pip2.7 install -t lib/ -r requirements.txt

1. To access Cloud SQL:

    - create file: backend/env_config.py to store sensitive logins, passwords and keys. The .gitignore will block these from being pushed to Github.


1. [Add Firebase to your app.](https://firebase.google.com/docs/web/setup#add_firebase_to_your_app)
1. Add your Firebase project ID to the backend’s `app.yaml` file as an
environment variable.
1. Select which providers you want to enable. Delete the providers from
`main.js` that you do no want to offer. Enable the providers you chose to keep
in the Firebase console under **Auth** > **Sign-in Method** >
**Sign-in providers**.
1. In the Firebase console, under **OAuth redirect domains**, click
**Add Domain** and enter the domain of your app on App Engine:
[PROJECT_ID].appspot.com. Do not include "http://" before the domain name.

## Run Locally
1. Install AppEngine included libaries listed in backend/app.yaml into your system python:

        pip install <package>

    These will automatically be imported into the runtime when deployed to AppEngine 

1. Add the backend host URL to `main.js`: http://localhost:8081.

1. Navigate to the root directory of the application and start the development
server with the following command:

        dev_appserver.py frontend/app.yaml backend/app.yaml

1. Visit [http://locahost:8080/](http://locahost:8080/) in a web browser.

## Deploy
1. Change the backend host URL in `main.js` to
https://backend-dot-[PROJECT_ID].appspot.com.
1. Deploy the application using the Cloud SDK command-line interface:

        gcloud app deploy frontend/app.yaml backend/app.yaml

    The Cloud Datastore indexes can take a while to update, so the application
    might not be fully functional immediately after deployment.

1. View the application live at https://[PROJECT_ID].appspot.com.


## TODO
  * Need to refactor backend into separate code files
  * Refactor frontend. Make each button in editor an ajax request instead of the entire editor being a form submission
  * Create 'share' feature to allow users to collaborate on editing
