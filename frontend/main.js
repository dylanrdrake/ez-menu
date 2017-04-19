$(function() {
  //local dev backendHostURL:
  backendHostUrl = 'http://localhost:8081';
  
  // production backendHostURL:
  //var backendHostUrl = 'https://backend-dot-ez-menu.appspot.com';
  

  // Loading gif
  $(document).ajaxStart(function() {
    //$('#menu-table-div').hide();
    $('.loading').show();
  });
  
  $(document).ajaxComplete(function() {
    $('.loading').hide();
    //$('#menu-table-div').show();
  });
  // Loading gif




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
          var shared = $('<span class="glyphicon glyphicon-ok green" aria-hidden="true"></span>');
        }
        else {
          var shared = $('<span class="glyphicon glyphicon-remove red" aria-hidden="true"></span>');
        }
        if (menu.PublicLink != null) {
          var published = $('<span class="glyphicon glyphicon-ok green" aria-hidden="true"></span>');
        }
        else {
          var published = $('<span class="glyphicon glyphicon-remove red" aria-hidden="true"></span>');
        }
        var $menutr = $('<tr>').addClass('menu-table-row');
        $menutr.append($('<td>').addClass('menu-table-data menu-id-data'));
        $menutr.append($('<td>').addClass('menu-table-data menu-title-data'));
        $menutr.append($('<td>').addClass('menu-table-data menu-theme-data'));
        $menutr.append($('<td>').addClass('menu-table-data menu-shared-data'));
        $menutr.append($('<td>').addClass('menu-table-data menu-published-data'));
        $menutr.append($('<td>').addClass('menu-table-btn menu-edit-data'));
        $menutr.append($('<td>').addClass('menu-table-btn menu-publish-data'));
        if (menu.PublicLink != null) {
          $menutr.find('.menu-publish-data').append($('<a class="menu-takedown-btn"><span class="glyphicon glyphicon-ban-circle orange"></span></a>'));
        } else {
          $menutr.find('.menu-publish-data').append($('<a class="menu-publish-btn"><span class="glyphicon glyphicon-cloud-upload" aria-hidden="true"></span></a>'));
        }
        $menutr.append($('<td>').addClass('menu-table-btn menu-delete-data'));

        $menutr.find('.menu-id-data').text(menu.MenuId);
        $menutr.find('.menu-title-data').text(menu.MenuTitle);
        $menutr.find('.menu-theme-data').text(menu.Theme);
        $menutr.find('.menu-shared-data').append(shared);
        $menutr.find('.menu-published-data').append(published);
        $menutr.find('.menu-edit-data').append($('<a class="menu-edit-btn" aria-label="Left Align"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>'));
        $menutr.find('.menu-delete-data').append($('<a class="menu-delete-btn red"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></a>'));
        $('#menu-table-body').append($menutr);
      });
    });
  }
  ///////// [END home]
 


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
  $('#menu-table').on('click', '.menu-edit-btn', function() {
    var menuid = $(this).parent().siblings('.menu-id-data').text();
    $.ajax({
      url: backendHostUrl + '/menus',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'GET',
      data: {'MenuId': menuid},
      contentType: 'application/json',
      success: function(menu) {
        $('#item-level-data').empty();

        $('#editor-id-input').val(menu.MenuId);
        $('#editor-title-input').val(menu.MenuTitle);
        $('#editor-theme-input').val(menu.Theme);
        $('#editor-itemsperpage-input').val(menu.ItemsPerPage);
        $('#editor-interval-input').val(menu.PageInterval);

        menu.Items.forEach(function(item) {
          var $thisitem = $('<form class="editor-item-form row">');
          $thisitem.append($('<div class="col-xs-1" hidden><input name="ItemId" class="editor-item-id-input form-control"></div>'));
          $thisitem.append($('<div class="col-xs-3"><input name="ItemTitle" class="editor-item-title-input form-control"></div>'));
          $thisitem.append($('<div class="col-xs-7"><input name="ItemDesc" class="editor-item-desc-input form-control"></div>'));
          $thisitem.append($('<div class="col-xs-1 pull-right"><button type="button" class="editor-delete-item-btn form-control btn btn-danger" aria-label="Left Align"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button></div>'));
          $thisitem.append($('<div class="col-xs-1 pull-right"><input name="ItemPrice" class="editor-item-price-input form-control"></div>'));

          $thisitem.find(".editor-item-id-input").val(item.ItemId);
          $thisitem.find(".editor-item-title-input").val(item.ItemTitle);
          $thisitem.find(".editor-item-desc-input").val(item.ItemDesc);
          $thisitem.find(".editor-item-price-input").val(item.ItemPrice);
          $("#item-level-data").append($thisitem);
        });

        $("#editor-div").show(300);
      },
      error: function(error) {
        console.log(error);
      }
    });
  });
  // Edit menu
  


  // Add item
  $('#editor-add-item-btn').click(function() {
    var $newitem = $('<form class="editor-item-form row">');
    $newitem.append($('<div class="col-xs-3"><input name="ItemTitle" class="editor-item-title-input form-control" value="Temporary Item Title"></div>'));
    $newitem.append($('<div class="col-xs-7"><input name="ItemDesc" class="editor-item-desc-input form-control"></div>'));
    $newitem.append($('<div class="col-xs-1 pull-right"><button type="button" class="editor-delete-item-btn form-control btn-danger" aria-label="Left Align"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>'));
    $newitem.append($('<div class="col-xs-1 pull-right"><input name="ItemPrice" class="editor-item-price-input form-control"></div>'));
    $("#item-level-data").append($newitem);
  });
  // Add item
  

  
  // Delete item
  $('#item-level-data').on('click', '.editor-delete-item-btn', function() {
    event.preventDefault();
    $(this).parent().parent().data('delete', true);
    $(this).parent().parent().hide('slow');
  });
  // Delete item



  // Save menu
  $('#editor-save-btn').click(function() {
    var menuform = $('#menu-level-data').serializeArray();
    var menudata = {};
    menuform.forEach(function(data) {
      menudata[data.name] = data.value;
    });

    menudata.Items = [];
    var itemforms = $('.editor-item-form');

    itemforms.each(function(i, item) {
      var itemform = $(item).serializeArray();
      var itemdata = {};
      
      if ($(item).data('delete') == true) {
        itemdata['DELETE'] = true;
      }

      itemform.forEach(function(data) {
        itemdata[data.name] = data.value;
      });
    
      menudata.Items.push(itemdata);
    });
    
    $.ajax({
      url: backendHostUrl + '/menus',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'PUT',
      data: JSON.stringify([menudata]),
      contentType: 'application/json'
    }).then(function() {
      $('#editor-div').hide(300);
    }).then(function() {
      home();
    });
  
  });
  // Save menu
  


  // Cancel menu
  $('#editor-cancel-btn').click(function() {
    $('#editor-div').hide(300);
  });
  // Cancel menu



  // Publish menu
  // Use .on because publish buttons are added
  // dynamically on page
  $('#menu-table').on('click', '.menu-publish-btn', function() {
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
      }).then(function() {
        home();
      });

    } else {
      // do nothing
      home();
    }
  });
  // Publish menu
 


  // Takedown menu
  $('#menu-table').on('click', '.menu-takedown-btn', function() {
    if (confirm('Are you sure you want to take this menu down?')) {

      var menuid = $(this).parent().siblings('.menu-id-data').text();
      $.ajax({
        url: backendHostUrl + '/menus',
        headers: {'Authorization': 'Bearer ' + userIdToken},
        method: 'PUT',
        data: JSON.stringify([{'MenuId': menuid,
                               'Takedown': true}]),
        contentType: 'application/json'
      }).then(function() {
        home();
      });
    
    } else {
      home();
    }
  });
  // Takedown menu



  // Delete menu
  $('#menu-table').on('click', '.menu-delete-btn', function() {
    if (confirm('Are you sure you want to delete this menu?')) {

      var menuid = $(this).parent().siblings('.menu-id-data').text();
      $.ajax({
        url: backendHostUrl + '/menus',
        headers: {'Authorization': 'Bearer ' + userIdToken},
        method: 'DELETE',
        data: JSON.stringify([{'MenuId': menuid}]),
        contentType: 'application/json'
      }).then(function() {
        home();
      });

    } else {
      home();
    }
  });
  // Delete menu




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
