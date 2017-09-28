
var accessToken = null;
var eventId = "AAMkAGFlNDNlNzY1LTFlYjItNDhlYS1hZDA3LTM3Y2I5MTlhYjJhMwBGAAAAAAAhImL_e_VGSb_G7fZzkklrBwDxXQjzZcrsT6FUTpFjRccvAAAAbcATAACdd7ma6szWS5fz_3TeYgtuAADyosQBAAA=";

$(document).on('click','#syncCalendar',function(){

  var token = office365_auth();

});

//Auth
function office365_auth(){

  var userAgentApplication = new Msal.UserAgentApplication("dee73589-2413-457e-8b2d-bbeeaa0f0f65", null, function (errorDes, token, error, tokenType) {
    // this callback is called after loginRedirect OR acquireTokenRedirect (not used for loginPopup/aquireTokenPopup)
  })

  userAgentApplication.loginPopup(["User.Read","Calendars.ReadWrite"]).then(function (idToken) {
    //Login Success
    userAgentApplication.acquireTokenSilent(["User.Read","Calendars.ReadWrite"]).then(function (accessToken) {
      //AcquireToken Success
      //Récupération des événements des 10 prochains jours
      /*scheduler.getAgentsEvents()[0].events.forEach(function(event) {
        updateEvent(accessToken,event);
      });*/

      //console.log(json_event(scheduler.getAgentsEvents()[0].events[0]));
      //updateEvent(accessToken,scheduler.getAgentsEvents()[0].events[0]);
    }, function (error) {
      //AcquireToken Failure, send an interactive request.
      userAgentApplication.acquireTokenPopup(["User.Read","Calendars.ReadWrite"]).then(function (accessToken) {
        //getEvents(accessToken);
      }, function (error) {
        console.log(error);
      });
    })
  }, function (error) {
    console.log(error);
  });
}

//"https://outlook.office.com/api/v2.0/me/calendarview?startDateTime=2017-01-01T01:00:00&endDateTime=2017-12-31T23:00:00&$select=Subject",
/*function getEvents(token){
  $.ajax({
    type: "GET",
    url:"https://graph.microsoft.com/v1.0/me/events",
    headers: {
      "Authorization": "Bearer " + token
    },
    success : function(data){

    },
    error : function(error){

    }
  });
}*/

function updateEvent(token,event){

  var _json_event = json_event(event);

  $.ajax({
    type: "PATCH",
    url:"https://graph.microsoft.com/v1.0/me/events/"+eventId,
    data : JSON.stringify(_json_event),
    contentType: "application/json; charset=utf-8",
    headers: {
      "Authorization": "Bearer " + token
    },
    success : function(data){

    },
    error : function(error){
      //Evenement supprimer du coté de outlook
      if(error.status == 404){
        createEvent(token,event);
      }
    }
  });

}

function createEvent(token,event){

  var _json_event = json_event(event);

  $.ajax({
    type: "POST",
    url:"https://graph.microsoft.com/v1.0/me/events",
    data : JSON.stringify(_json_event),
    contentType: "application/json; charset=utf-8",
    headers: {
      "Authorization": "Bearer " + token
    },
    success : function(data){
      //Récupération de l'id de la nouvelles création
      event.setOId(data.id);
    },
    error : function(error){

    }
  });
}

function json_event(event){

  return {
    "subject": event.type.toString(),
    "body": {
      "contentType": "HTML",
      "content": event.comments
    },
    "start": {
        "dateTime": event.start.format("YYYY-MM-DD[T]HH:mm:ss"),
        "timeZone": "Europe/Paris"
    },
    "end": {
        "dateTime": event.end.format("YYYY-MM-DD[T]HH:mm:ss"),
        "timeZone": "Europe/Paris"
    },
    "location":{
        "displayName": event.client
    }
  };

}
