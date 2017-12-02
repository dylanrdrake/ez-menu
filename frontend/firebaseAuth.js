// Firebase credentials
var config = {
  apiKey: "AIzaSyAPAEZg9AMSlE2cqC5h2_7VelZP5Md0wpc",
  authDomain: "ez-menu.firebaseapp.com",
  projectId: "ez-menu",
  //databaseURL: "https://ez-menu.firebaseio.com",
  //storageBucket: "ez-menu.appspot.com",
  //messagingSenderId: "834479782686"
};

// This is passed into the backend to authenticate the user.
var userIdToken = null;


// Firebase log-in
function configureFirebaseLogin() {
  $('#logged-in').hide();

  firebase.initializeApp(config);

  // [START onAuthStateChanged]
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      $('#logged-out').hide();
      var name = user.displayName;
      var authProvider = user.providerData[0].providerId;

      /* If the provider gives a display name, use the name for the
      personal welcome message. Otherwise, use the user's email. */
      var welcomeName = name ? name : user.email;

      user.getToken().then(function(idToken) {
        userIdToken = idToken;

        /* Now that the user is authenicated, fetch the notes. */
        home();

        $('#user').text(welcomeName);
        $('#auth-prov-span').text(authProvider);
        $('#logged-in').show();

      });

    } else {
      $('#logged-in').hide();
      $('#logged-out').show();

    }
  // [END onAuthStateChanged]

  });

}


// [START configureFirebaseLoginWidget]
// Firebase log-in widget
function configureFirebaseLoginWidget() {
  var uiConfig = {
    'signInSuccessUrl': '/',
    'signInOptions': [
      // Add Authentication providers.
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    // Terms of service url
    //'tosUrl': '<your-tos-url>',
  };

  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  ui.start('#firebaseui-auth-container', uiConfig);
}
// [END configureFirebaseLoginWidget]
