$(function(){
  //local dev backendHostURL:
  var backendHostUrl = 'http://localhost:8081';
  
  // production backendHostURL:
  //var backendHostUrl = 'https://backend-dot-ez-menu.appspot.com';

  // Initialize Firebase
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

    firebase.initializeApp(config);

    // [START onAuthStateChanged]
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        $('#logged-out').hide();
        var name = user.displayName;

        /* If the provider gives a display name, use the name for the
        personal welcome message. Otherwise, use the user's email. */
        var welcomeName = name ? name : user.email;

        user.getToken().then(function(idToken) {
          userIdToken = idToken;

          /* Now that the user is authenicated, fetch the notes. */
          home();

          $('#user').text(welcomeName);
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
        // Leave the lines as is for the providers you want to offer your users.
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
  //////////////////////// END Firebase /////////////////////////





  //////////////////////// [START home] //////////////////////////
  // home
  function home() {
    $.ajax(backendHostUrl + '/menus', {
      headers: {
        'Authorization': 'Bearer ' + userIdToken
      }
    }).then(function(data) {
      $('.menu-table-row').remove();
      // Iterate over user data to display user's notes from database.
      data.forEach(function(menu) {
        if (menu.SharedWith != null) {
          var shared = 'Yes';
        }
        else {
          var shared = 'No';
        }
        if (menu.PublicLink != null) {
          var published = 'Yes';
        }
        else {
          var published = 'No';
        }
        $.get('menurow.html', function(menurow) {
          var $menutr = $(menurow);
          $menutr.find('.menu-id-data').text(menu.MenuId);
          $menutr.find('.menu-title-data').text(menu.MenuTitle);
          $menutr.find('.menu-theme-data').text(menu.Theme);
          $menutr.find('.menu-shared-data').text(shared);
          $menutr.find('.menu-published-data').text(published);
          $('#menu-table-body').append($menutr);
        });
      });
    });
  }
  // [END home]
  

  // Create menu
  var createMenuBtn = $('#create-menu-btn');
  createMenuBtn.click(function(event) {
    event.preventDefault();

    $.ajax(backendHostUrl + '/menus', {
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'POST',
      data: JSON.stringify([{'MenuTitle': 'Temporary Title'}]),
      contentType: 'application/json'
    }).then(function() {
      home();
    });
  });
  // Create menu
  

  // Edit menu
  $('#menu-table').on('click', 'button.menu-edit-btn', function() {
    
    var menuid = $(this).parent().siblings('.menu-id-data').text();
    $.ajax({
      url: backendHostUrl + '/menus',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'GET',
      data: {'MenuId': menuid},
      contentType: 'application/json',
      success: function(menu) {
        $('#editor-items-div').empty();

        $('#editor-title-input').val(menu.MenuTitle);
        $('#editor-theme-input').val(menu.Theme);
        $('#editor-interval-input').val(menu.PageInterval);

        menu.Items.forEach(function(item) {
          var $thisitem = $('<div>').addClass('editor-item-form');
          $thisitem.append($('<input>').addClass('editor-item-title-input'));
          $thisitem.append($('<input>').addClass('editor-item-desc-input'));
          $thisitem.append($('<input>').addClass('editor-item-price-input'));

          $thisitem.find(".editor-item-title-input").val(item.ItemTitle);
          $thisitem.find(".editor-item-desc-input").val(item.ItemDesc);
          $thisitem.find(".editor-item-price-input").val(item.ItemPrice);
          $("#editor-form #editor-items-div").append($thisitem);
        });

        $("#editor-div").show(100);
      },
      error: function(error) {
        console.log(error);
      }
    });
  });
  // Edit menu


  // Close editor
  $('#editor-save-btn').click(function() {
    $('#editor-div').hide(100);
  });
  // Close editor


  // Publish
  // Use .on because publish buttons are added
  // dynamically on page
  $('#menu-table').on('click', 'button.menu-publish-btn', function() {
    if (confirm('Are you sure you want to publish this menu?')) {
      
      var menuid = $(this).parent().siblings('.menu-id-data').text();
      $.ajax({
        url: backendHostUrl + '/menus',
        headers: {'Authorization': 'Bearer ' + userIdToken},
        method: 'PUT',
        data: JSON.stringify([{'MenuId': menuid,
                              'Publish': true}]),
        contentType: 'application/json'
      }).then(function() {
        home();
      }).then(function() {
        $.ajax({
          url: backendHostUrl + '/menus',
          headers: {'Authorization': 'Bearer ' + userIdToken},
          method: 'GET',
          data: {'MenuId': menuid},
          contentType: 'application/json',
          success: function(data) {
            window.open(data.PublicLink, '_blank');
          },
          error: function(error) {
            console.log(error);
          }
        });
      });

    } else {
      // do nothing
      home();
    }
  });
  // Publish



  // [START signOutBtn]
  // Sign out a user
  var signOutBtn = $('#sign-out-btn');
  signOutBtn.click(function(event) {
    event.preventDefault();

    firebase.auth().signOut().then(function() {
      console.log("Sign out successful");
    }, function(error) {
      console.log(error);
    });
  });
  // [END signOutBtn]



 


  configureFirebaseLogin();
  configureFirebaseLoginWidget();

});
