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
  $('#editor-div').find('.temp-option')
                  .css('background-color',newbgcolor);
  $('#editor-div .invert').css('color',invertColor(newbgcolor,true));
}
//



// Update background image
function changeBkgrdImage (input) {
  var newbgimage = $(input.target).val();
  $('#editor-div').css('background-image','url("'+newbgimage+'")')
                  .css('background-size', '100%');
}
// Update background image



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
  var change_color = $(input.target).parent().siblings()
                                    .find('.change-color');
  change_color.css('color', newcolor);
  $(input.target).css('background-color', newcolor);
  $(input.target).css('color', newcolorinv);
}
// Update text input colors



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
  $(this).parent().parent().parent().find('.item-delete-input')
                                    .val(true);
  $(this).parent().parent().parent().hide('slow');
});
// Delete item



// Delete section
$(document).on('click', '.delete-sect-btn', function() {
  event.preventDefault();
  if (confirm('Are you sure you want to delete this Section?')) {
    $(this).parent().parent().parent().find('.sect-delete-input')
                                      .val(true);
    $(this).parent().parent().parent().parent().hide('slow');
  }
});
// Delete section



// Save menu
$(document).on('click', '#editor-save-btn', function() {
  $('#editor-save-btn').attr('disabled', 'disabled');

  // Menu data dict
  var menudict = {};

  // Menu level data
  $('#editor-div').find('.menu-data').each(function(i ,menudata) {
    menudict[$(menudata).attr('name')] = $(menudata).val();

    // 'Sections': [{}, {}, ...]
    menudict['Sections'] = [];

    // Iterate through each Section
    $('#editor-div').find('.sect-row.added').each(function(i, sect) {
      var sectdict = {};

      $(sect).find('.sect-data').each(function(i, sectdata) {
        sectdict[$(sectdata).attr('name')] = $(sectdata).val();
      });
      sectdict['Items'] = [];

      // Iterate through each item row
      $(sect).find('.item-row').each(function(i, item) {
        var itemdict = {};
        // Iterate within the item row for item data
        $(item).find('.item-data').each(function(i, itemdata) {
          itemdict[$(itemdata).attr('name')] = $(itemdata).val();
        });
        sectdict['Items'].push(itemdict);
      });
      menudict['Sections'].push(sectdict);

    });
  });

  // Send array of menu dicts, in this case just one dict
  $.ajax({
    url: backendHostUrl + '/menus',
    headers: {'Authorization': 'Bearer ' + userIdToken},
    method: 'PUT',
    data: JSON.stringify([menudict]),
    contentType: 'application/json'
  }).then(function() {
    $('#editor-save-btn').removeAttr('disabled');
  });

});
// Save menu



// Close editor
$(document).on('click', '#editor-cancel-btn', function() {
  $('#editor-div').hide("slide", {direction: "up"}, 300);
  home();
});
// Close editor
