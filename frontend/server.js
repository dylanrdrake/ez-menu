function server(endpoint, method, data) {
  $.ajax(backendHostUrl + '/' + endpoint, {
    headers: {'Authorization': 'Bearer ' + userIdToken},
    method: method,
    contentType: 'application/json',
    data: JSON.stringify(data),
    success: function(result) {return result;},
    error: function(error) {
      console.log(error);
      return;
    }
  });
}


server('menus', 'POST', {'MenuId': menuid});
if 
