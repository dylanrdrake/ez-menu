$(function() {
  //local dev backendHostURL:
  //backendHostUrl = 'http://localhost:8081';

  // production backendHostURL:
  var backendHostUrl = 'https://backend-dot-ez-menu.appspot.com';


  // gen random color
  function getRandomColor() {
    var colorLetters = '0123456789ABCDEF';
    var colorString = '#';
    for (var i = 0; i < 6; i++) {
      colorString += colorLetters[Math.floor(Math.random() * 16)];
    }
    return colorString;
  };
  // gen random color


  // apply colors to logo
  function logoColors() {
    var time = 0;
    var bkdgcolor = $('#top-row').css('color');
    $('.title-char').each(function(i, titlechar) {
      var charcolor = getRandomColor();
      $(titlechar).css('color',bkdgcolor);
      setTimeout(function() {
        $(titlechar).css('color', charcolor);
      }, time);
      time += 30;
    });
  };
  // apply colors to logo

  
  // Ajax request loading animation
  $(document).ajaxStart(function() {
    function loadStart() {
      logoColors();
    };

    var loadInterval = setInterval(function() { loadStart() }, 300);

    $(document).ajaxStop(function() {
      clearInterval(loadInterval);
      logoColors();
    });
  });
  // Ajax request loading animation



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


 

  // tooltips
  $(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
  });
  //




  //////////////////////// [START home] //////////////////////////
  // home
  function home() {
    $(document).scrollTop(0);

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
          var published = $('<span class="glyphicon glyphicon-ok green" aria-hidden="true"></span><button type="button" data-toggle="tooltip" title="Get Link" class="basic-btn btn-lg get-pub-link-btn"><span class="glyphicon glyphicon-link blue"></span></button><button type="button" data-toggle="tooltip" title="Take down" class="basic-btn btn-lg menu-takedown-btn"><span class="glyphicon glyphicon-ban-circle orange"></span></button>');
        }
        else {
          var published = $('<span class="glyphicon glyphicon-remove red" aria-hidden="true"></span><button type="button" data-toggle="tooltip" title="Publish" class="basic-btn btn-lg menu-publish-btn"><span class="glyphicon glyphicon-globe blue"></span></button>');
        }
        
        var $menutr = $('<tr>').addClass('menu-table-row');
        $menutr.append($('<td>').addClass('menu-table-btn menu-edit-data'));
        $menutr.append($('<td>').addClass('menu-table-data menu-id-data'));
        $menutr.append($('<td>').addClass('menu-table-data menu-title-data'));
        $menutr.append($('<td>').addClass('menu-table-data menu-shared-data'));
        $menutr.append($('<td>').addClass('menu-table-data menu-published-data'));
        $menutr.append($('<td>').addClass('menu-table-btn menu-delete-data'));

        $menutr.find('.menu-edit-data').append($('<button type="button" data-toggle="tooltip" title="Edit" class="menu-edit-btn btn-lg form-control" aria-label="Left Align"><span class="glyphicon glyphicon-pencil blue" aria-hidden="true"></span></button>'));
        $menutr.find('.menu-id-data').text(menu.MenuId);
        $menutr.find('.menu-title-data').text(menu.MenuTitle);
        $menutr.find('.menu-shared-data').append(shared);
        $menutr.find('.menu-published-data').append(published);
        $menutr.find('.menu-delete-data').append($('<button type="button" data-toggle="tooltip" title="Delete" class="menu-delete-btn btn-lg form-control"><span class="glyphicon glyphicon-trash red" aria-hidden="true"></span></button>'));
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
    $('.added').remove();
    $('#editor-save-btn').removeAttr('disabled');
    var menuid = $(this).parent().siblings('.menu-id-data').text();

    $.ajax({
      url: backendHostUrl + '/users',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'GET',
      contentType: 'application/json',
      success: function(user) {
        user.Templates.forEach(function(template) {
          $('#template-select').append(
            $('<option>'+template.TemplateName+'</option>').attr(
              'id',template.TemplateId).attr('role', 'button')
              .attr('href', '#').attr('data-toggle', 'dropdown')
              .addClass('added temp-option invert'));
        });
      },
      error: function(error) {
        console.log(error);
      }
    }).then(function() {

      $.ajax({
        url: backendHostUrl + '/menus',
        headers: {'Authorization': 'Bearer ' + userIdToken},
        method: 'GET',
        data: {'MenuId': menuid},
        contentType: 'application/json',
        success: function(menu) {
          $('#editor-id-input').val(menu.MenuId);
          $('#editor-title-input').val(menu.MenuTitle);

          $('#menu-title-color-input').colorpicker()
            .on('changeColor', function(el) {
              changeTextColor(el);
          });
          $('#menu-title-color-input').val(menu.MenuTitleColor).change();

          $('#menu-bkgrd-color-input').colorpicker()
            .on('changeColor', function(el) {
              changeBkgrdColor(el);
              $(el.target).css('color', invertColor($(el.target).val(), true));
          });
          $('#menu-bkgrd-color-input').val(menu.MenuBkgrdColor).change();

          $('#menu-logo-input').val(menu.MenuLogo);

          $('#menu-font-input')
            .on('change', function(el) {
              changeEditorFont(el);
            })
            .val(menu.MenuFont).change();

          $('#menu-font-size-input')
            .on('change', function(el) {
              changeEditorFontSize(el);
            })
            .val(menu.MenuFontSize).change();

          $('#template-select').ready( function() {
            $('.temp-option').each(function(i, tempopt) {
              if (String(tempopt.id) == String(menu.Template)) {
                $(tempopt).attr('selected', 'selected');
              }
              else {
                $(tempopt).removeAttr('selected');
              }
            });
          });

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
            $section.find('.sect-color-input').colorpicker()
              .on('changeColor', function(el) {
                changeTextColor(el);
            }).val(sect.SectionTitleColor).change();
            
            sect.Items.forEach(function(item) {
              var $itemrow = $itemrow_temp.clone();
              $itemrow.removeAttr('id');
              $itemrow.find('.item-id-input').val(item.ItemId);
              $itemrow.find('.item-title-input').val(item.ItemTitle);
              $itemrow.find('.item-title-color-input').colorpicker()
                .on('changeColor', function(el) {
                  changeTextColor(el);
              }).val(item.ItemTitleColor).change();
              $itemrow.find('.item-stock-input').val(item.ItemStock);
              $itemrow.find('.item-price-input').val(item.ItemPrice)
                .css('color', item.ItemTitleColor);
              $itemrow.find('.item-desc-input').val(item.ItemDesc);
              $itemrow.find('.item-desc-color-input').colorpicker()
                .on('changeColor', function(el) {
                  changeTextColor(el);
              }).val(item.ItemDescColor).change();
              $section.find('.add-item-btn-row').before($itemrow);
            });

            $('#add-sect-div').before($section);
            
          });

        },
        error: function(error) {
          console.log(error);
        }
      });
    });
    
    $("#editor-div").show("slide", {direction:"up"}, 300);

  });
  ///////////////// Edit menu ////////////////////////////////
  

  
  
  // Highlight fields
  $(document).on('click', '#edit-hl-fields-btn', function() {
    $('.field').toggleClass('toggle-border');
  });
  // Highlight fields
  
  
  // Invert color
  function invertColor(hex, bw) {
    if (hex.indexOf('#') === 0) {
      hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
      throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
      // http://stackoverflow.com/a/3943023/112731
      return (r * 0.299 + g * 0.587 + b * 0.114) > 186
          ? '#000000'
          : '#FFFFFF';
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
  }
  //



  // Update background color
  function changeBkgrdColor (input) {
    var newbgcolor = $(input.target).val();
    $('#editor-div').css('background-color',newbgcolor);
    $('#editor-div').find('.temp-option').css('background-color',newbgcolor);
    $('#editor-div .invert').css('color',invertColor(newbgcolor,true));
  }
  //


  // Update menu editor font
  function changeEditorFont (input) {
    var newfont = $(input.target).val();
    $('#editor-font').not($('#editor-save-btn-div')).attr('href',
      'https://fonts.googleapis.com/css?family='+newfont);
    $('#editor-div').css('font-family', newfont);
  }
  //


  // Update menu editor font size
  function changeEditorFontSize (input) {
    var newfontsize = $(input.target).val()/10.0;
    $('.font1').each(function(i, elem) {
      $(elem).css('font-size', String(newfontsize*1.5)+'vh');
    });
    $('.font2').each(function(i, elem) {
      $(elem).css('font-size', String(newfontsize*2)+'vh');
    });
    $('.font3').each(function(i, elem) {
      $(elem).css('font-size', String(newfontsize*3)+'vh');
    });
  }
  //


  // Update text input colors
  function changeTextColor (input) {
    var newcolor = $(input.target).val();
    var newcolorinv = invertColor(newcolor,true);
    var change_color = $(input.target).parent().siblings().find('.change-color');
    change_color.css('color', newcolor);
    $(input.target).css('background-color', newcolor);
    $(input.target).css('color', newcolorinv);
  }
  //


  // Add section
  $(document).on('click', '.add-sect-btn', function() {
    event.preventDefault();
    var newsect = $('#SectionTemplate').clone();
    newsect.find('.sect-color-input').colorpicker()
      .on('changeColor', function(el) {
        changeTextColor(el);
      }).val('#333333').change();
    newsect.find('.item-row').remove();
    newsect.removeAttr('hidden');
    newsect.addClass('added');
    $(this).parent().parent().before(newsect);
  });
  // Add section


  // Add item
  $(document).on('click', '.add-item-btn', function() {
    event.preventDefault();
    var newitem = $('#ItemTemplate').clone();
    newitem.find('.item-title-color-input').colorpicker()
      .on('changeColor', function(el) {
        changeTextColor(el);
      }).val('#333333').change();
    newitem.find('.item-desc-color-input').colorpicker()
      .on('changeColor', function(el) {
        changeTextColor(el);
      }).val('#333333').change();


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
    $('#editor-save-btn').attr('disabled', 'disabled');
    var menudict = {};
    $('#editor-div').find('.menu-data').each(function(i ,menudata) {
     
      if ($(menudata).attr('name') == 'Template') {
        menudict['Template'] = $(menudata).children(':selected').attr('id');
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
      $('#editor-div').hide("slide", {direction: "up"}, 300);
    }).then(function() {
      home();
    });
  
  });
  // Save menu
  


  // Cancel editor
  $('#editor-cancel-btn').click(function() {
    $('#editor-div').hide("slide", {direction: "up"}, 300);
    home();
  });
  // Cancel editor



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
                               'Publish': false}]),
        contentType: 'application/json'
      }).then(function() {
        home();
      });
    
    } else {
      home();
    }
  });
  // Takedown menu



  // Get public link
  $('#menu-table').on('click', '.get-pub-link-btn', function() {
    var menuid = $(this).parent().siblings('.menu-id-data').text();
    $.ajax({
      url: backendHostUrl + '/menus',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'GET',
      data: {'MenuId': menuid},
      contentType: 'application/json',
      success: function(menudata) {
        prompt('Public Link for '+menudata.MenuTitle, menudata.PublicLink);
      },
      error: function(error) {
        console.log(error);
      }
    });
  });
  // Get public link



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
