$(function() {
  //local dev backendHostURL:
  //backendHostUrl = 'http://localhost:8081';
  
  // production backendHostURL:
  var backendHostUrl = 'https://backend-dot-ez-menu.appspot.com';
  

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
          $menutr.find('.menu-publish-data').append($('<a class="menu-publish-btn"><span class="glyphicon glyphicon-globe" aria-hidden="true"></span></a>'));
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
      data: JSON.stringify([{'MenuTitle': 'No Title'}]),
      contentType: 'application/json'
    }).then(function() {
      home();
    });
  });
  // Create menu
  


  /////////////// Edit menu ///////////////////////////////////
  $('#menu-table').on('click', '.menu-edit-btn', function() {
    var menuid = $(this).parent().siblings('.menu-id-data').text();

    $.ajax({
      url: backendHostUrl + '/menus',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'GET',
      data: {'MenuId': menuid},
      contentType: 'application/json',
      success: function(menu) {
        $('.added').remove();
        $('#editor-id-input').val(menu.MenuId);
        $('#editor-title-input').val(menu.MenuTitle);
        $('#editor-title-input').css('color',menu.MenuTitleColor);
        $('#menu-title-color-input').val(menu.MenuTitleColor);
        $('#editor-div').css('background-color',menu.MenuBkgrdColor);
        $('#menu-bkgrd-color-input').val(menu.MenuBkgrdColor);

        var $section_temp = $('#SectionTemplate').clone();
        var $itemrow_temp = $('#ItemTemplate').clone();
        $section_temp.find('#ItemTemplate').remove();
        $section_temp.removeAttr('hidden');
        
        menu.Sections.forEach(function(sect) {
          var $section = $section_temp.clone();
          $section.removeAttr('id');
          $section.addClass('added');
          $section.find('.sect-id-input').val(sect.SectionId);
          $section.find('.sect-title-input').val(sect.SectionTitle);
          $section.find('.sect-title-input').css('color',sect.SectionTitleColor);
          $section.find('.sect-color-input').val(sect.SectionTitleColor);
          
          sect.Items.forEach(function(item) {
            var $itemrow = $itemrow_temp.clone();
            $itemrow.removeAttr('id');
            $itemrow.find('.item-id-input').val(item.ItemId);
            $itemrow.find('.item-title-input').val(item.ItemTitle);
            $itemrow.find('.item-title-input').css('color',item.ItemTitleColor);
            $itemrow.find('.item-title-color-input').val(item.ItemTitleColor);
            $itemrow.find('.item-stock-input').val(item.ItemStock);
            $itemrow.find('.item-price-input').val(item.ItemPrice);
            $itemrow.find('.item-desc-input').val(item.ItemDesc);
            $itemrow.find('.item-desc-input').css('color',item.ItemDescColor);
            $itemrow.find('.item-desc-color-input').val(item.ItemDescColor);
            $section.find('.add-item-btn-row').before($itemrow);
          });

          $('#add-sect-div').before($section);
          
        });

      },
      error: function(error) {
        console.log(error);
      }
    });

    $.ajax({
      url: backendHostUrl + '/users',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'GET',
      contentType: 'application/json',
      success: function(user) {
        user.Templates.forEach(function(template) {
          $('#template-select').append($('<option>'+template.TemplateName+'</option>').attr('id', template.TemplateId).addClass('added temp-option'));
        });
      },
      error: function(error) {
        console.log(error);
      }
    });
    
    $("#editor-div").show(300);

  });
  ///////////////// Edit menu ////////////////////////////////
  


  // Update Menu title legend
  //$('#editor-title-input').on('change', function() {
  //  var menutitleinput = $(this).val();
  //  $('#menu-title-legend').text(menutitleinput);
  //});
  // Update Menu title legend
  


  // Update Section title legend
  //$('#sections-div').on('change', '.sect-title-input', function() {
  //  var secttitleinput = $(this).val();
  //  $(this).parent().parent().parent().find('.sect-title-legend').text(secttitleinput);
  //  $(this).parent().parent().parent().parent().siblings('.sect-items').find('legend').text(secttitleinput+' - Items');
  //});
  // Update Section title legend


  // Update background color
  $('#editor-div').on('change', '#menu-bkgrd-color-input', function() {
    var newbgcolor = $(this).val();
    $('#editor-div').css('background-color',newbgcolor);
  });


  // Update text input colors
  $('#editor-div').on('change', '.color-input', function() {
    var newcolor = $(this).val();
    var change_color = $(this).parent().siblings().find('.change-color');
    change_color.css('color', newcolor);
  });
  //



  // Add item
  $(document).on('click', '.add-item-btn', function() {
    event.preventDefault();
    var newitem = $('#ItemTemplate').clone();
    $(this).parent().parent().before(newitem);
  });
  // Add item
  

  
  // Delete item
  $(document).on('click', '.delete-item-btn', function() {
    event.preventDefault();
    $(this).parent().parent().parent().find('.item-delete-input').val(true);
    $(this).parent().parent().parent().hide('slow');
  });
  // Delete item



  // Add section
  $(document).on('click', '.add-sect-btn', function() {
    event.preventDefault();
    var newsect = $('#SectionTemplate').clone();
    newsect.removeAttr('hidden');
    newsect.addClass('added');
    $(this).parent().parent().before(newsect);
  });
  // Add section


  // Delete section
  $(document).on('click', '.delete-sect-btn', function() {
    event.preventDefault();
    if (confirm('Are you sure you want to delete this Section?')) {
      $(this).parent().parent().parent().find('.sect-delete-input').val(true);
      $(this).parent().parent().parent().parent().hide('slow');
    }
  });
  // Delete section



  // Save menu
  $('#editor-save-btn').click(function() {
    var menudict = {};
    $('#editor-div').find('.menu-data').each(function(i ,menudata) {
     
      if ($(menudata).attr('name') == 'Template') {
        menudict['Template'] = $(menudata).attr('id');
        return true;
      }

      menudict[$(menudata).attr('name')] = $(menudata).val();

      menudict['Sections'] = [];
      
      $('#editor-div').find('.sect-row.added').each(function(i, sect) {
        var sectdict = {};
      
        $(sect).find('.sect-data').each(function(i, sectdata) {
          sectdict[$(sectdata).attr('name')] = $(sectdata).val();
        });

        sectdict['Items'] = [];

        $(sect).find('.item-row').each(function(i, item) {
          var itemdict = {};

          $(item).find('.item-data').each(function(i, itemdata) {
            itemdict[$(itemdata).attr('name')] = $(itemdata).val();
          });

          sectdict['Items'].push(itemdict);
        });
        
        menudict['Sections'].push(sectdict);
      });

    });

    //console.log(menudict);
    
    $.ajax({
      url: backendHostUrl + '/menus',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'PUT',
      data: JSON.stringify([menudict]),
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
