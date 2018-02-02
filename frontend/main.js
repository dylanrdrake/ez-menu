//local dev backendHostURL:
//var backendHostUrl = 'http://localhost:8081';

// production backendHostURL:
var backendHostUrl = 'https://backend-dot-ez-menu.appspot.com';



// Firebase
$(function() {
  configureFirebaseLogin();
  configureFirebaseLoginWidget();
});
// Firebase



// Run loading animation for all AJAX requests
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
// Run loading animation for all AJAX requests



// home
function home() {
  $(document).scrollTop(0);

  $.ajax(backendHostUrl + '/menus', {
    headers: {'Authorization': 'Bearer ' + userIdToken}
  }).then(function(data) {
    $('.menu-table-row').remove();
    // Iterate over user data to display user's notes from database.
    data.forEach(function(menu) {
      if (menu.SharedWith != null) {
        var shared = $('<span class="glyphicon glyphicon-ok green" \
aria-hidden="true"></span>');
      }
      else {
        var shared = $('<span class="glyphicon glyphicon-remove red" \
aria-hidden="true"></span>');
      }

      if (menu.PublicLink != null) {
        var published = $('<span class="glyphicon glyphicon-ok \
green" aria-hidden="true"></span><button type="button" \
data-toggle="tooltip" title="Get Link" class="basic-btn \
btn-lg get-pub-link-btn"><span class="glyphicon \
glyphicon-link blue"></span></button><button type="button" \
data-toggle="tooltip" title="Take down" class="basic-btn \
btn-lg menu-takedown-btn"><span class="glyphicon \
glyphicon-ban-circle orange"></span></button>');
      }
      else {
        var published = $('<span class="glyphicon glyphicon-remove \
red" aria-hidden="true"></span><button type="button" \
data-toggle="tooltip" title="Publish" class="basic-btn \
btn-lg menu-publish-btn"><span class="glyphicon \
glyphicon-globe blue"></span></button>');
      }

      var $menutr = $('<tr>').addClass('menu-table-row');
      $menutr.append($('<td>')
             .addClass('menu-table-btn menu-edit-data'));
      $menutr.append($('<td>')
             .addClass('menu-table-data menu-id-data'));
      $menutr.append($('<td>')
             .addClass('menu-table-data menu-title-data'));
      $menutr.append($('<td>')
             .addClass('menu-table-data menu-shared-data'));
      $menutr.append($('<td>')
             .addClass('menu-table-data menu-published-data'));
      $menutr.append($('<td>')
             .addClass('menu-table-btn menu-delete-data'));

      $menutr.find('.menu-edit-data').append($('<button \
type="button" data-toggle="tooltip" title="Edit" \
class="menu-edit-btn btn-lg form-control" aria-label="Left Align">\
<span class="glyphicon glyphicon-pencil blue" aria-hidden="true">\
</span></button>'));
      $menutr.find('.menu-id-data').text(menu.MenuId);
      $('head').append($('<link>',
                         {type:'text/css',
                         rel:'stylesheet',
                    href:'https://fonts.googleapis.com/css?family='+
                         menu.MenuFont}));
      //$menutr.find('.menu-title-data').append($('<img>',
      //                                         {src:menu.MenuLogo,
      //                                        style:'height:3vh;',
      //                                         }));
      $menutr.find('.menu-title-data').append(menu.MenuTitle)
             .css('font-family', menu.MenuFont).change();
      $menutr.find('.menu-shared-data').append(shared);
      $menutr.find('.menu-published-data').append(published);
      $menutr.find('.menu-delete-data').append($('<button \
type="button" data-toggle="tooltip" title="Delete" \
class="menu-delete-btn btn-lg form-control"><span class="glyphicon \
glyphicon-trash red" aria-hidden="true"></span></button>'));
      //$menutr.css('background-color', menu.MenuBkgrdColor);
      //$menutr.css('color', menu.MenuTitleColor);
      $('#menu-table-body').append($menutr);
    });
  });
}
// home



// New menu -> select template
$(document).on('click', '#new-menu-btn', function(event) {
  event.preventDefault();
  $('#template-select .added-option').remove();
  // /users, GET
  $.ajax(backendHostUrl + '/users', {
    headers: {'Authorization': 'Bearer ' + userIdToken},
    method: 'GET',
    contentType: 'application/json',
    success: function(userdata) {
      userdata.Templates.forEach(function(template) {
        $('#template-select').append($('<option>')
          .attr('tempId', template.TemplateId)
          .attr('tempName', template.TemplateName)
          .addClass('added-option')
          .text(template.TemplateName));
      });
    },
    error: function(error) {
      console.log(error);
    }
  }).then(function() {
    $('#new-menu-btn-div').hide();
    $('#create-menu-btns-div').show();
  });
});
// New menu -> select template



// Disable Create button when no template is selected
$(function() {
  $('#template-select').on('change', function() {
    var $selectedTemp = $(this).find('option:selected').attr('name');
    if ($selectedTemp == 'default') {
      $('#create-menu-btn').attr('disabled', true);
    }
    else {
      $('#create-menu-btn').attr('disabled', false);
    }
  });
});
// Disable Create button when no template is selected



// Create menu
$(document).on('click', '#create-menu-btn', function(event) {
  event.preventDefault();
  var $tempId = $('#template-select').find('option:selected')
      .attr('tempId');
  var $tempName = $('#template-select').find('option:selected')
      .attr('tempName');
  // /menus, POST, [{}]
  $.ajax(backendHostUrl + '/menus', {
    headers: {'Authorization': 'Bearer ' + userIdToken},
    method: 'POST',
    data: JSON.stringify([{'MenuTitle': 'No Title',
                           'Template': $tempId,
                           'TemplateName': $tempName}]),
    contentType: 'application/json'
  }).then(function() {
    $('#create-menu-btns-div').hide();
    $('#new-menu-btn-div').show();
    home();
  });
});
// Create menu



// Cancel menu
$(document).on('click', '#cancel-menu-btn', function(event) {
  event.preventDefault();
  $('#create-menu-btns-div').hide();
  $('#new-menu-btn-div').show();
});
//


// Populate editor fields
function populateEditor(menu) {
  // populate editor id
  $('#editor-id-input').val(menu.MenuId);
  // populate template indicator
  $('#template-indicator').val(menu.TemplateName);
  // populate editor title
  $('#editor-title-input').val(menu.MenuTitle);
  // create editor title color picker
  $('#menu-title-color-input').colorpicker()
    .on('changeColor', function(el) {
      changeTextColor(el);
    });
  // populate editor title color
  $('#menu-title-color-input').val(menu.MenuTitleColor)
                              .change();
  // create editor background color picker
  $('#menu-bkgrd-color-input').colorpicker()
    .on('changeColor', function(el) {
      changeBkgrdColor(el);
      $(el.target).css('color',
                        invertColor($(el.target).val(), true));
    });
  // populate editor background color
  $('#menu-bkgrd-color-input').val(menu.MenuBkgrdColor)
                              .change();
  // populate editor background image link
  $('#menu-bkgrd-img-input')
    .on('change', function(el) {
      changeBkgrdImage(el);
    }).val(menu.MenuBkgrdImage).change();
  // populate editor logo link
  $('#menu-logo-input').val(menu.MenuLogo);
  // populate editor logo size
  $('#menu-logo-size-input').val(menu.MenuLogoSize);
  // populate editor font
  $('#menu-font-input')
    .on('change', function(el) {
      changeEditorFont(el);
    })
    .val(menu.MenuFont).change();
  // populate editor font size
  $('#menu-font-size-input')
    .on('change', function(el) {
      changeEditorFontSize(el);
    })
    .val(menu.MenuFontSize).change();

  // iterate through SECTIONS from server
  var sections = $('#editor-div').find('.sect-row:visible');
  $(menu.Sections).each(function(i, sect) {
    // create section if it doesn't exist
    if (sections[i] === undefined) {
      var newsection = addSection();
      $('#add-sect-div').before(newsection);
    }
    else { var newsection = sections[i] }
    // populate section id
    $(newsection).find('.sect-id-input').val(sect.SectionId);
    // populate section title
    $(newsection).find('.sect-title-input').val(sect.SectionTitle);
    // populate section title font color
    $(newsection).find('.sect-color-input').colorpicker()
      .on('changeColor', function(el) {
        changeTextColor(el);
    }).val(sect.SectionTitleColor).change();

    // iterate over each ITEM from the server
    var items = $(newsection).find('.item-row:visible');
    $(sect.Items).each(function(j, item) {
      // if item doesn't exit in editor, create it
      if (items[j] === undefined) {
        var newitem = addItem();
        $(newsection).find('.add-item-btn-row').before(newitem);
      }
      else { var newitem = items[j] }
      // populate item id
      $(newitem).find('.item-id-input').val(item.ItemId);
      // populate item title
      $(newitem).find('.item-title-input').val(item.ItemTitle);
      // populate item title font color
      $(newitem).find('.item-title-color-input').colorpicker()
        .on('changeColor', function(el) {
          changeTextColor(el);
      }).val(item.ItemTitleColor).change();
      // populate item stock note
      $(newitem).find('.item-stock-input').val(item.ItemStock);
      // populate item price
      $(newitem).find('.item-price-input').val(item.ItemPrice)
        .css('color', item.ItemTitleColor);
      // populate item description
      $(newitem).find('.item-desc-input').val(item.ItemDesc);
      // populate item description color
      $(newitem).find('.item-desc-color-input').colorpicker()
        .on('changeColor', function(el) {
          changeTextColor(el);
      }).val(item.ItemDescColor).change();
    });
  });
};
// Populate editor fields


// Refresh editor data //
function refreshEditor(menuid) {
  // /users, GET
  $.ajax({
    url: backendHostUrl + '/menus',
    headers: {'Authorization': 'Bearer ' + userIdToken},
    method: 'GET',
    data: {'MenuId': menuid},
    contentType: 'application/json',
    success: function(menu) {
      populateEditor(menu);
    },
    error: function(error) {
      console.log(error);
    }
  });
};
// Refresh editor data //


/////////////////// Edit menu /////////////////////////
$(document).on('click', '.menu-edit-btn', function() {
  // remove added elements from previous editor opens
  $('.added').remove();
  // enable save button from previous editor save
  $('#editor-save-btn').removeAttr('disabled');
  // get menu id from menu-table
  var menuid = $(this).parent().siblings('.menu-id-data').text();
  // populate menu function
  refreshEditor(menuid);
  // editor show animation
  $("#editor-div").show("slide", {direction:"up"}, 300);
});
//////////////////// Edit menu /////////////////////////



// Publish menu
$(document).on('click', '.menu-publish-btn', function() {
  if (confirm('Are you sure you want to publish this menu?')) {

    var menuid = $(this).parent().siblings('.menu-id-data').text();
    // /menus, PUT, [{}, ...]
    $.ajax({
      url: backendHostUrl + '/menus',
      headers: {'Authorization': 'Bearer ' + userIdToken},
      method: 'PUT',
      data: JSON.stringify([{'MenuId': menuid,
                            'Publish': true}]),
      contentType: 'application/json'
    }).then(function() {
      // /menus, GET
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
  }
  else {
    // do nothing
    home();
  }
});
// Publish menu



// Get public link
$(document).on('click', '.get-pub-link-btn', function() {
  var menuid = $(this).parent().siblings('.menu-id-data').text();
  // /menus, GET
  $.ajax({
    url: backendHostUrl + '/menus',
    headers: {'Authorization': 'Bearer ' + userIdToken},
    method: 'GET',
    data: {'MenuId': menuid},
    contentType: 'application/json',
    success: function(menudata) {
      prompt('Public Link for '+menudata.MenuTitle,
             menudata.PublicLink);
    },
    error: function(error) {
      console.log(error);
    }
  });
});
// Get public link


// Takedown menu
$(document).on('click', '.menu-takedown-btn', function() {
  if (confirm('Are you sure you want to take this menu down?')) {

    var menuid = $(this).parent().siblings('.menu-id-data').text();
    // /menus, PUT, [{}, ...]
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



// Delete menu
$(document).on('click', '.menu-delete-btn', function() {
  if (confirm('Are you sure you want to delete this menu?')) {

    var menuid = $(this).parent().siblings('.menu-id-data').text();
    // /menus, DELETE, [{}, ...]
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



// tooltips
$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();
});
//



// Cycle logo colors
$(document).on('click', '#rand-logo-color-btn', function(event) {
  event.preventDefault();
  logoColors();
});



// Sign out
$(document).on('click', '#sign-out-btn', function(event) {
  event.preventDefault();

  firebase.auth().signOut().then(function() {
    console.log("Sign out successful");
  }, function(error) {
    console.log(error);
  });
});
// Sign out
