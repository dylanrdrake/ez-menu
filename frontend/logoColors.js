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
  var bkdgcolor = $('#top-row').css('background-color');
  $('.title-char').each(function(i, titlechar) {
    var charcolor = getRandomColor();
    $(titlechar).css('color',bkdgcolor);
    $(titlechar).attr('data-toggle', 'tooltip');
    $(titlechar).attr('title', charcolor.toString());
    setTimeout(function() {
      $(titlechar).css('color', charcolor);
    }, time);
    time += 30;
  });
};
// apply colors to logo
