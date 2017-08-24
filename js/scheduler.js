moment.locale('fr');

(function ( $ ) {

    var hours = [8,9,10,11,12,13,14,15,16,17];

    //EVENTS
    var events = [{
      agent: "Benoit Rastier",
      events : [{
        id: '1',
        start: "21/08/2017 08:45",
        end: "21/08/2017 17:00",
        title: "411BCMI",
        type: "Hotline",
        color: "#E74C3C"
      },{
        id: '2',
        start: "21/08/2017 12:30",
        end: "21/08/2017 16:45",
        title: "411LOGIS",
        type: "Atelier",
        color: "#8E44AD"
      },{
        id: '3',
        start: "21/08/2017 14:30",
        end: "22/08/2017 15:00",
        title: "411LOGIS",
        type: "Dev",
        color: "#5499C7"
      },{
        id: '5',
        start: "22/08/2017 08:30",
        end: "22/08/2017 15:00",
        title: "411LOGIS",
        type: "Regie",
        color: "#52BE80"
      },{
        id: '6',
        start: "23/08/2017 08:30",
        end: "23/08/2017 15:00",
        title: "411LOGIS",
        type: "Contrat",
        color: "#E67E22"
      }]
    },{
      agent: "Charles Cluzel",
      events : []
    }];

    var slicedArray = undefined;

    var height = undefined;

    var shade = "#556b2f";
    var self = undefined;
    var scheduler = undefined;
    var startDate = undefined;
    var dateRange = undefined;
    var daysRange = undefined;
    var hoursRange = undefined;
    var agentTable = undefined;
    var agents = ["Benoit Rastier","Charles Cluzel","Matthieu Nowak","Nicolas Maniez","Florent Quétaud","Joel Pelhate","Nicolas Villain","Lionel Tarlet","Jerome Papuchon","Yoann Pachet"];

    var selector = undefined;
    var selectorActive = false;

    //Event
    var direction = undefined;
    var select = false;
    var resize = false;

    $.fn.scheduler = function() {
      self = this;
      init(this);
    };

    function init(obj){
      $.get("./assets/templates/scheduler.tmpl.html", function(data){

        height = ($(window).height() - 139) / agents.length;

        scheduler = $(data);

        selector = $('.selector',scheduler);
        selector.height(height);
        $('.glyphicon',selector).css('line-height',height + "px");

        $(".planning",scheduler).css({
          'height':$(window).height()-140,
          'right': -getScrollBarWidth()
        });

        //Set Hour
        dateRange = $(".dateRange",scheduler);
        daysRange = $(".days tbody tr",scheduler);
        setDateRange(moment().isoWeekday(1));

        //paintHours
        hoursRange = $(".hours tbody tr",scheduler);
        paintHours();

        //Set agents list
        agentTable = $(".agents",scheduler);
        setAgentList();

        $(self).html(scheduler);

        for(var i=0;i<events.length;i++){
          refreshLine(i);
        }

        bindEvent(scheduler);

        tippy('.event');

      });

    };

    function refreshLine(agent){

      //Reorganiser tableau element.
      //events.sort(sortEvents);
      events[agent].events.sort(sortEvents);

      var event = events[agent].events;
      var positionningArray = [[0]];
      slicedArray = events[agent].events.slice(1);
      var positionned = false;
      var newArray = false;
      var noOtherDimension = false;
      var eventsInArray = [0];

      slicedArray.forEach(function(element,idx){

        var elemStart = moment(element.start,"DD/MM/YYYY HH:mm");
        var elemEnd = moment(element.end,"DD/MM/YYYY HH:mm");

        var greppedEvent = $.grep(event.slice(0,idx+1), function( a ) {
                             return a.agent == element.agent &&
                              a.id != element.id &&
                              ((moment(a.start,"DD/MM/YYYY HH:mm").isBefore(elemEnd) &&
                              moment(a.start,"DD/MM/YYYY HH:mm").isAfter(elemStart)) ||
                              (elemStart.isBefore(moment(a.end,"DD/MM/YYYY HH:mm")) &&
                              elemStart.isAfter(moment(a.start,"DD/MM/YYYY HH:mm"))));
                           });
        if(greppedEvent.length == 0){
          //console.log(positionningArray);
          displayElement(agent,eventsInArray,positionningArray);
          eventsInArray = [idx+1];
          positionningArray = [[idx+1]];
          newArray = true;
          positionned = true;
        }

        positionningArray.forEach(function(dimension){

          var greppedEvent = $.grep(event.slice(idx+1), function( a ) {
                               return a.agent == element.agent &&
                                a.id != element.id &&
                                ((moment(a.start,"DD/MM/YYYY HH:mm").isBefore(elemEnd) &&
                                moment(a.start,"DD/MM/YYYY HH:mm").isAfter(elemStart)) ||
                                (elemStart.isBefore(moment(a.end,"DD/MM/YYYY HH:mm")) &&
                                elemStart.isAfter(moment(a.start,"DD/MM/YYYY HH:mm"))));
                             });

          if(!noOtherDimension && !newArray && (!positionned || greppedEvent.length == 0)){
            var lastOfRow = event[dimension[dimension.length - 1]];
            var endLastRow = moment(lastOfRow.end,"DD/MM/YYYY HH:mm");
            var startLastRow = moment(lastOfRow.start,"DD/MM/YYYY HH:mm");

            if(moment(element.start,"DD/MM/YYYY HH:mm").isAfter(endLastRow)){
                dimension.push(idx+1);
                if(!eventsInArray.includes(idx+1)) eventsInArray.push(idx+1);
                positionned = true;
            } else if(positionned){
                noOtherDimension = true;
            }
          }

        });

        if(!positionned){
          if(!eventsInArray.includes(idx+1)) eventsInArray.push(idx+1);
          positionningArray.push([idx+1]);
        }

        positionned = false;
        newArray = false;
        noOtherDimension = false;

      });

      //console.log(positionningArray);
      if(event.length > 0) displayElement(agent,eventsInArray,positionningArray);

    }

    function displayElement(agent,eventsInArray,positionningArray){

      eventsInArray.forEach(function(element,idx){

          var element = events[agent].events[element];
          var elementAgent = events[agent].agent;
          idx += positionningArray[0][0];

          var beginningRow = undefined;
          var numberOfRow = 0;

          for(var i = 0;i<positionningArray.length;i++){
            if(positionningArray[i].includes(idx)){
              if(beginningRow == undefined)
                beginningRow = i;

              numberOfRow += 1;
            }
          }

          var elemHeight = (height / positionningArray.length) * numberOfRow;
          var top = (height / positionningArray.length) * beginningRow;

          var where = $('tr[data-agent="'+elementAgent+'"] .grid .row',agentTable);

          var start = moment(element.start,"DD/MM/YYYY HH:mm");
          var left = $('td[data-date="'+start.format('DD HH:mm')+'"]',where).offset().left - 160;

          var end = moment(element.end,"DD/MM/YYYY HH:mm");
          end.add(-15,'minutes');
          var right = $('td[data-date="'+end.format('DD HH:mm')+'"]',where);

          var right = ($(window).width() - right.offset().left) - right.width() - 2;

          where.append('<div data-animation="perspective" data-arrow="true" \
          data-size="big" title="'+element.title+'" data-agent="'+agent+'" data-index="'+idx+'" id='+element.type+' class="event ui-widget ui-widget-content" \
          style="height:'+elemHeight+'px;top:'+top+'px;left:'+left+'px;right:'+right+'px"> \
          <p><b>'+start.format("HH:mm")+' - '+end.add(15,'minutes').format("HH:mm")+'</b></p></div>');

          $(".event#"+element.type,where).css({ 'background' : LightenDarkenColor(element.color,70)});
          $(".event#"+element.type+" p",where).css({ 'color' : element.color});
          $('html > head').append("<style> .event#"+element.type+" div {background : "+element.color+"} </style>");

      });

    }

    function bindEvent(scheduler){
      //unbind first
      $(".changeDate .btn",document).unbind();
      $(".quarter",document).unbind();
      $(".planning",document).unbind();
      $(".event").unbind();
      $('.selector',document).unbind();
      $(window).unbind();
      //$(".event",scheduler).unbind();

      //Change range date
      $(".changeDate .btn",document).bind("click",function(){
        if($(this).attr('id') == "left"){
          date = startDate.add(-7,'days');
          setDateRange(date);
        } else {
          date = startDate.add(7,'days');
          setDateRange(date);
        }
      });

      //lorsque le clique de la souris est pressé
      $(".quarter",document).mousedown(function(e) {
          // You can record the starting position with
          /*var self = this;*/

          if(resize == false && select == false){

          setSelectorGlyphiconDisplayed("none");
          select = true;

          var clickedElement = $(e.target);
          //var start_x = clickedElement.position().left;
          var start_x = clickedElement.offset().left;
          var scroll = $('.planning',document).scrollTop();

          setSelectorDisplayed("block");
          setSelectorPosition(clickedElement.offset().top + scroll - 139
          ,start_x
          ,"auto");

          $(".planning",document).mousemove(function(e) {
            if(e.pageX > 160){
              if(e.pageX > start_x){
                selector.css({
                  'left':start_x,
                  'right':$(window).width() - e.pageX
                });
                direction = 'right';
              } else {
                selector.css({
                  'left':e.pageX + 1,
                  'right':$(window).width() - start_x
                });
                direction = 'left';
              }
            }
          });

        } else {

          $('.quarter',document).trigger("mouseup",e);

        }

      });

      //Lorsque la souris est relaché
      $(".quarter",document).mouseup(function(e,evt){

        var pageX = e.pageX || evt.pageX;
        var pageY = e.pageY || evt.pageY;

        $(".planning").unbind("mousemove");

        if(select == true){
          select = false;

          element = $(document.elementFromPoint(pageX,pageY));
          if(direction == 'right'){
            selector.css('right',$(window).width() - (element.offset().left+element.width()+1));
          } else {
            selector.css('left',element.offset().left);
          }

          setSelectorGlyphiconDisplayed("block");
        } else if( resize != false){
          var tr = resize;

          resize = false;

          var left =  parseInt(tr.css('left')) + 160;
          var right =  $(window).width() - parseInt(tr.css('right'));

          tr.hide();
          element = $(document.elementFromPoint(pageX,pageY));
          if(direction == 'right'){
            if(pageX > left)
              tr.css('right',$(window).width() - (element.offset().left+element.width()+1));
          } else {
            if(pageX < right)
              tr.css('left',element.offset().left-160);
          }
          tr.show();
        }

      });

      //Si la souris quitte le planning
      $(".planning",document).mouseleave(function(event){

        if(select){

          $(".planning").unbind("mousemove");

          if(direction == 'right'){
            element = $(document.elementFromPoint(selector.offset().left + selector.width(),selector.offset().top));
            selector.css('right',$(window).width() - (element.position().left+element.width()+1));
          } else {
            element = $(document.elementFromPoint(selector.offset().left-1,selector.offset().top));
            selector.css('left',element.position().left);
          }

          setSelectorGlyphiconDisplayed("block");
          select = false;

        }

      });

      var resizElement = undefined;
      var axis = undefined;
      $(".event").resizable({
          handles: 'e, w',
          start: function( event,ui) {
            resizElement = $(this);
            axis = resizElement.data('ui-resizable').axis;
          },
          resize: function(event,ui){
            resizElement.hide();
            var elem = $(document.elementFromPoint(event.pageX,event.pageY));

            var originalDates = $('p',resizElement).html();

            newDate = moment(elem.attr('data-date'),"DD HH:mm");
            if(axis == "e"){
              //Ajout d'un quart d'heure
              newDate = originalDates.substr(0,originalDates.indexOf(" - ")+1) + " - " + newDate.add(15,"minutes").format("HH:mm");
            } else {
              newDate = newDate.add(15,"minutes").format("HH:mm") + " - " + originalDates.substr(originalDates.indexOf(" - ")+3);
            }

            $('p',resizElement).html(newDate);
            resizElement.show();
          },
          stop: function( event) {

          },
      }).on('resize',function(e){
        e.stopPropagation();
      });

      var dragElement = undefined;
      var previousAgentRow = undefined;
      $(".event").draggable({
        containment: [160,140,$(window).width(),$(window).height()],
        scroll: false,
        start: function() {
          dragElement = $(this);
          previousAgentRow = dragElement.closest('.row');
          dragElement.css({
            "left":"auto",
            "right":"auto",
            "width":$(this).width()
          });
        },
        stop: function(e) {
          var offset = dragElement.offset();
          var width = dragElement.width();
          var id = dragElement.attr('data-index');
          var previousAgent = dragElement.attr('data-agent');
          dragElement.hide();

          var doc = $(document.elementFromPoint(e.pageX,e.pageY));
          var agent = agents.indexOf(doc.closest('.agent').attr('data-agent'));
          doc.closest('.row').find('.event').remove();

          if(previousAgent != agent) id = putEventOnNewAgent(dragElement,id,previousAgent,agent);

          var event = events[agent].events[id];
          //var duration = moment(event.end,"DD/MM/YYYY HH:mm").diff(moment(event.start,"DD/MM/YYYY HH:mm"));
          var duration = Math.ceil((width * 50 / ($(document).width() - 160)) * 3600000);

          //calcule du debut et de la fin.
          var start = getMomentWithLeft(offset.left - 160);
          var end = addDurationToMoment(start,duration);
          //data-elem
          changeIndexElementHours(events[agent].events[id],start,end);
          refreshLine(agent);
          if(previousAgent != agent){
             //$('.agent[data-agent="'++'"]'document).find('.event').remove();
             previousAgentRow.find('.event').remove();
             refreshLine(previousAgent);
          }

          bindEvent(scheduler);

        },
        drag: function(e,ui){
          if(ui.offset.left + dragElement.width() > $(window).width())
            ui.position.left = $(window).width() - dragElement.width() - 162;
          if(ui.offset.top + dragElement.height() > $(window).height())
            ui.position.top = $(window).height() - dragElement.height() - 140;
        }
      });

      //Add calendar event
      $('.selector',document).bind('click',function(){
        alert("toto");
      });

      //Refresh planning when window resize
      $( window ).resize(function() {
        init();
      });

    };

    function setDateRange(date){
      startDate = moment(date);
      date = date.format("DD MMM YYYY") + " - " + date.add(4,'days').format("DD MMM YYYY");
      dateRange.html(date);
      setDays();
    };

    function setDays(){
      daysRange.empty();

      var width = Math.trunc(($(window).width() - 160) / 5);

      for(var i = 0;i<5;i++){
        daysRange.append("<td width='"+width+"px'>"+moment(startDate).add(i,"days").date()+"</td>")
      }
    }

    function setAgentList(){
      agents.forEach(function(element){
        var string = "";
        var grid = paintGrid();
        string += "<tr class='agent' style='height:"+height+"px' data-agent='"+element+"'><td unselectable='on' onselectstart='return false;' onmousedown='return false;' class='name'>"+element+"</td> \
        <td class='grid'><table><tbody class='row'><tr>"+grid+"</tr></tbody></table></td></tr>";
        agentTable.append(string);
      });
    }

    function paintHours(){
      var i = moment('08','hh');
      var string = "";

      var pwidth = Math.trunc(($(window).width() - 160) / 5);
      var cwidth = $(window).width() > 1550 ? Math.trunc(pwidth/10) : Math.trunc(pwidth/5);
      var toadd = $(window).width() > 1550 ? 1 : 2;

      for(var x = 0;x<5;x++){
        string += "<td width='"+pwidth+"px'><table><tbody><tr>";
        do{
          string += "<td width='"+cwidth+"px'>"+i.hours()+":00</td>";
          i.add(toadd,"hours");
        }while(i.hours() <= 17)
        string += "</tr></tbody></table></td>";
        i.set('hour',8);
      }
      hoursRange.append(string);
    }

    function paintGrid(){
      var string = "";

      var pwidth = Math.trunc(($(window).width() - 160) / 5);
      var cwidth = Math.trunc(pwidth/10);
      var qwidth = Math.trunc(cwidth/4);

      for(var x = 0;x<5;x++){
        var day = moment().isoWeekday(1).add(x,'days').dates() + " ";
        string += "<td class='quarter' width='"+pwidth+"px'><table style='height:"+height+"px'><tbody><tr>";
        for(var i = 8;i<18;i++){
          var hour = ("00" + i).slice(-2) + ":";
          string += "<td class='quarter-child' width='"+cwidth+"px'><table style='height:"+height+"px'><tbody><tr>";
          for(var j = 0;j<4;j++){
            var date = day + hour + ("00" + j*15).slice(-2);
            string += "<td data-date='"+date+"' width='"+qwidth+"px'>";
          }
          string += "</td></tbody></table></td>";
        }
        string += "</tr></tbody></table></td>";
      }

      return string;
    }

    //Sauvegarder l'etat du selecteur de date
    function setSelectorActive(active){
      selectorActive = active;
    }

    //Positionner le selecteur
    function setSelectorPosition(top,left,right){
      selector.css({
        'top':top,
        'left':left,
        'right':right
      });
    }

    //Afficher le plus
    function setSelectorGlyphiconDisplayed(displayed){
      $('.glyphicon',selector).css({
        'display':displayed
      });
    }

    //Afficher le selecteur
    function setSelectorDisplayed(displayed){
      selector.css({
        'display':displayed
      });
    }

    function changeIndexElementHours(element,start,end){
      element.start = moment(element.start,"DD/MM/YYYY HH:mm").date(start.date()).hour(start.hour()).minute(start.minutes()).format("DD/MM/YYYY HH:mm");
      element.end = moment(element.end,"DD/MM/YYYY HH:mm").date(end.date()).hour(end.hour()).minute(end.minutes()).format("DD/MM/YYYY HH:mm");
    }

    function sortEvents(a,b){
      if(moment(a.start,"DD/MM/YYYY HH:mm").isAfter(moment(b.start,"DD/MM/YYYY HH:mm")))
        return 1
      if(moment(a.start,"DD/MM/YYYY HH:mm").isBefore(moment(b.start,"DD/MM/YYYY HH:mm")))
        return -1
    }

    function putEventOnNewAgent(element,id,previousAgent,agent){
      element.attr('data-agent',agent);
      events[agent].events.push(events[previousAgent].events[id]);
      events[previousAgent].events.splice(id,1);
      return events[agent].events.length - 1;
    }

    //calcule d'une heure
    function getMomentWithLeft(left,step){

      //Obtention du depart
      var rowWidth = $(window).width() - 160;
      var hours = (left * 50) / rowWidth;

      //Obtention du nombre de jour de difference
      var days = parseInt( hours / 10 );
      var day = moment().day(days+1);

      //calcule de l'heure et des minutes de depart
      var hour = Math.floor((hours - (10*days))) + 8;
      var minutes = (hours - (10*days) - Math.floor((hours - (10*days)))) * 60;

      minutes = (15*Math.floor(minutes/15));

      if(minutes == 60){
        minutes = 0;
        hour += 1;
      }

      return moment(day.date() + " " + hour + ":" + minutes,"DD HH:mm");
    }

    function addDurationToMoment(date,duration){
      date = moment(date);

      var hour = parseInt(duration / 3600000);
      var minutes = (duration / 3600000 - hour) * 60;
      minutes = (15*Math.ceil(minutes/15));

      for(var i = 0; i<Math.floor(hour);i++){
        if(moment(date).add(1,"hour").hour() < 18 ||
          moment(date).add(1,"hour").hour() == 18 && minutes == 0){
          date.add(1,"hour");
        } else {
          date.add(1,"day");
          date.set("hour",8);
        }
      }

      if(moment(date).add(minutes,"minutes").hour() > 18 ){
        date.add(1,"day");
        hour = duration - (14 * 3600000);
        date.set("hour",8);
        minutes = minutes - date.minutes();
      }

      date.add(minutes,"minutes");

      return date;
    }

    //Récupération de la taille de la scrollbar
    function getScrollBarWidth () {
      var inner = document.createElement('p');
      inner.style.width = "100%";
      inner.style.height = "200px";

      var outer = document.createElement('div');
      outer.style.position = "absolute";
      outer.style.top = "0px";
      outer.style.left = "0px";
      outer.style.visibility = "hidden";
      outer.style.width = "200px";
      outer.style.height = "150px";
      outer.style.overflow = "hidden";
      outer.appendChild (inner);

      document.body.appendChild (outer);
      var w1 = inner.offsetWidth;
      outer.style.overflow = 'scroll';
      var w2 = inner.offsetWidth;
      if (w1 == w2) w2 = outer.clientWidth;

      document.body.removeChild (outer);

      return (w1 - w2);
    };

    function LightenDarkenColor(col, amt) {

      var usePound = false;

      if (col[0] == "#") {
          col = col.slice(1);
          usePound = true;
      }

      var num = parseInt(col,16);

      var r = (num >> 16) + amt;

      if (r > 255) r = 255;
      else if  (r < 0) r = 0;

      var b = ((num >> 8) & 0x00FF) + amt;

      if (b > 255) b = 255;
      else if  (b < 0) b = 0;

      var g = (num & 0x0000FF) + amt;

      if (g > 255) g = 255;
      else if (g < 0) g = 0;

      return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);

  }

}( jQuery ));
