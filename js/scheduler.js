moment.locale('fr');

toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": true,
  "positionClass": "toast-bottom-center",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "2000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};

(function ( $ ) {

    var hours = [8,9,10,11,12,13,14,15,16,17];

    //EVENTS
    var agentsEvents = [];

    var slicedArray = undefined;

    var height = undefined;
    var self = undefined;
    var scheduler = undefined;
    var startDate = undefined;
    var dateRange = undefined;
    var daysRange = undefined;
    var hoursRange = undefined;
    var agentTable = undefined;
    var loader = undefined;
    var agents = ["Benoit Rastier","Charles Cluzel","Matthieu Nowak","Nicolas Maniez","Florent Quétaud","Joel Pelhate","Nicolas Villain","Lionel Tarlet","Jerome Papuchon","Yoann Pachet"];
    var colorArray = [{
      id:1,
      color:'#990000'
    },{
      id:2,
      color:'#008080'
    },{
      id:3,
      color:'#ff7f50'
    },{
      id:4,
      color:'#87ceeb'
    },{
      id:5,
      color:'#da70d6'
    },{
      id:6,
      color:'#ffa500'
    }];

    var selector = undefined;
    var selectorActive = false;
    var ttotal = 0;

    //Event
    var direction = undefined;
    var select = false;
    var resize = false;

    //calcule longeur des horaires
    var rowWidth = undefined;
    var oneDay = undefined;
    var oneHour = undefined;
    var oneQuarter = undefined;


    $.fn.scheduler = function() {
      self = this;

      //Récupération du loader
      loader = $(".loaders");

      init(this);


      //Refresh planning when window resize
      $( window ).resize(function() {
        init();
      });

      /*GESTION DU MODAL*/
      $('#editEventModal').on('shown.bs.modal', function() {
           generate_modal_body();
      });
    };

    function init(obj){

      $.get("./assets/templates/scheduler.tmpl.html", function(data){

        rowWidth = $(window).width() - 160;
        oneDay = rowWidth / 5;
        oneHour = oneDay / 10;
        oneQuarter = oneHour / 4;

        agentsEvents = [];

        var horaires = [
          "28/08/2017 08:30-28/08/2017 12:30",
          "28/08/2017 14:00-28/08/2017 17:45",
          "29/08/2017 08:30-29/08/2017 12:30",
          "29/08/2017 14:00-29/08/2017 17:45",
          "30/08/2017 08:30-30/08/2017 12:30",
          "30/08/2017 14:00-30/08/2017 17:45",
          "31/08/2017 08:30-31/08/2017 12:30",
          "31/08/2017 14:00-31/08/2017 17:45",
          "01/09/2017 08:30-01/09/2017 12:30",
          "01/09/2017 14:00-01/09/2017 17:45",
        ];
        //Remplissage des evenements
        agents.forEach(function(element,idx){

          agentsEvents.push(new Agent());


          for(var i=0;i<10;i++){
            color = colorArray[Math.floor(Math.random()*colorArray.length)];
            agentsEvents[idx].addEvent({
              id:i,
              start:horaires[i%10].substr(0,horaires[i%10].indexOf('-')),
              end:horaires[i%10].substr(horaires[i%10].indexOf('-')+1),
              title:"LAMBDA",
              type: color.id,
              color: color.color
            });
          }

        });


        height = ($(window).height() - 144) / agents.length;

        scheduler = $(data);

        selector = $('.selector',scheduler);
        selector.height(height);
        $('.glyphicon',selector).css('line-height',height + "px");

        $(".planning",scheduler).css({'height':$(window).height()-141});

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

        //A ne pas faire lors d'un init
        colorArray.forEach(function(element,idx){
          $('html > head').append("<style> .event[data-type='"+element.id+"'] div {background : "+element.color+"} </style>");
        });

        for(var i=0;i<agentsEvents.length;i++){
          refreshLine(i);
        }

        //console.log('Total affichage : ' + ttotal);

        bindGlobalEvent();
        bindEvent(scheduler);

        tippy('.event');

      });

    };

    function refreshLine(agent){

      //Reorganiser tableau element.

      var event = agentsEvents[agent].events;
      var positionningArray = [[0]];
      slicedArray = agentsEvents[agent].events.slice(1);
      var positionned = false;
      var newArray = false;
      var noOtherDimension = false;
      var eventsInArray = [0];

      slicedArray.forEach(function(element,idx){

        //if a.start == elemStart does not work.
        var greppedEvent = $.grep(event.slice(0,idx+1), function( a ) {
                             return (a.start.isBefore(element.end) &&
                              a.start.isSameOrAfter(element.start)) ||
                              (element.start.isBefore(a.end) &&
                              element.start.isAfter(a.start));
                           });
        if(greppedEvent.length == 0){
          //console.log(positionningArray);
          displayElements(agent,eventsInArray,positionningArray);
          eventsInArray = [idx+1];
          positionningArray = [[idx+1]];
          newArray = true;
          positionned = true;
        }

        if(!newArray){
          positionningArray.forEach(function(dimension){

            var greppedEvent = $.grep(event.slice(idx+1), function( a ) {
                                 return (a.start.isBefore(element.end) &&
                                  a.start.isAfter(element.start)) ||
                                  (element.start.isBefore(a.end) &&
                                  element.start.isAfter(a.start));
                               });

            if(!noOtherDimension && !newArray && (!positionned || greppedEvent.length == 0)){
              var lastOfRow = event[dimension[dimension.length - 1]];

              if(moment(element.start,"DD/MM/YYYY HH:mm").isSameOrAfter(lastOfRow.end)){
                  dimension.push(idx+1);
                  if(!eventsInArray.includes(idx+1)) eventsInArray.push(idx+1);
                  positionned = true;
              } else if(positionned){
                  noOtherDimension = true;
              }
            }

          });
        }

        if(!positionned){
          if(!eventsInArray.includes(idx+1)) eventsInArray.push(idx+1);
          positionningArray.push([idx+1]);
        }

        positionned = false;
        newArray = false;
        noOtherDimension = false;

      });

      //console.log(positionningArray);
      if(event.length > 0) displayElements(agent,eventsInArray,positionningArray);

    }

    function displayElements(agent,eventsInArray,positionningArray){

      //var t0 = performance.now();
      var where = getAgentRow(agent);

      eventsInArray.forEach(function(element,idx){

          var element = agentsEvents[agent].events[element];

          displayElement(idx+positionningArray[0][0],
                        agent,
                        element,
                        positionningArray,
                        where);

          /**/

      });

      /*var t1 = performance.now();
      ttotal += t1 - t0;
      console.log("Display Element " + (t1 - t0) + " milliseconds.");*/

    }

    function displayElement(idx,agent,element,positionningArray,where){

      //Récupération de la position vertical
      var topHeight = getTopHeight(idx,positionningArray);

      //Récupération de la position horizontal
      var start = moment(element.start,"DD/MM/YYYY HH:mm");
      var left = getLeftWithMoment(start);

      var end = moment(element.end,"DD/MM/YYYY HH:mm");
      right = rowWidth - getLeftWithMoment(end);

      where.append('<div data-animation="perspective" data-arrow="true" \
      data-size="big" title="'+element.title+'" data-agent="'+agent+'" \
      data-index="'+idx+'" data-type='+element.type+' class="event ui-widget ui-widget-content" \
      style="height:'+topHeight.height+'px;top:'+topHeight.top+'px;left:'+left+'px;right:'+right+'px;"> \
      <div style="background:linear-gradient(to top,'+element.color+','+LightenDarkenColor(element.color,50)+');"><p style="color:white"><b>'+start.format("HH:mm")+' - '+end.format("HH:mm")+'</b></p></div></div>');

    }

    function bindGlobalEvent(){

      //Change range date
      $(".changeDate .btn",document)
      .off("click")
      .on("click",function(){
        console.log("clicked");
        if($(this).attr('id') == "left"){
          date = startDate.add(-7,'days');
          setDateRange(date);
        } else {
          date = startDate.add(7,'days');
          setDateRange(date);
        }
      });

      //lorsque le clique de la souris est pressé
      $(".quarter",document)
      .off("mousedown")
      .on("mousedown",function(e) {
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
      $(".quarter",document)
      .off("mouseup")
      .on("mouseup",function(e,evt){

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
      $(".planning",document)
      .off("mouseleave")
      .on("mouseleave",function(event){

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

      //Add calendar event
      $('.selector',document)
      .off('click')
      .on('click',function(){
        //alert("toto");
      });

    }

    function bindEvent(scheduler){
      //unbind first
      /*$(".changeDate .btn",document).unbind();
      $(".quarter",document).unbind();
      $(".planning",document).unbind();
      $(".event").unbind();
      $('.selector',document).unbind();
      $(window).unbind();*/
      //$(".event",scheduler).unbind();

      var resizElement = undefined;
      var axis = undefined;

      var dragElement = undefined;

      $(".agent").livequery(
      '.event',
      function(elem) {

          $(elem).resizable({
            handles: 'e, w',
            start: function( e,ui) {
              resizElement = $(this);
              resizElement.css({'z-index':'10000'});
              axis = resizElement.data('ui-resizable').axis;
            },
            resize: function(e,ui){
              var offset = resizElement.offset();
              var width = resizElement.width();

              var start = getMomentWithLeft(offset.left - 160);
              var end = addDurationToMoment(start,width);

              setElementTexte(resizElement,start.format('HH:mm') + ' - ' + end.format('HH:mm'));
            },
            stop: function(e) {

              var infos = getDragElementInfo(resizElement);

              var agent = getAgent(resizElement.offset().top);
              removeEventRow(agent);

              var event = agentsEvents[agent].events[infos.id]

              majAndRefreshAgents(infos,event,agent);
            },
        }).on('resize',function(e){
          e.stopPropagation();
        });


        //.draggable( "disable" )
        $(elem).draggable({
          containment: [160,140,$('.agents').width()-$(elem).width(),$(window).height()-$(elem).height()],
          scroll: false,
          start: function() {
            dragElement = $(this);
            dragElement.css({
              "left": "auto",
              "right": "auto",
              "z-index": "10000",
              "width": rowWidth - Math.ceil(parseFloat(dragElement.css('right'))) - Math.ceil(parseFloat(dragElement.css('left')))
            });
          },
          stop: function(e) {

            try {

              //Récupération des informations
              var infos = getDragElementInfo(dragElement);

              //Masquer les evenements de la ligne
              var agent = getAgent(infos.offset.top);
              removeEventRow(agent);

              //Affichage du chargement
              toggleLoad();

              //Récupération de l'événement
              var event = infos.previousAgent != agent ? putEventOnNewAgent(infos.id,infos.previousAgent,agent) : agentsEvents[agent].events[infos.id];

              //Mise a jour de l'element et refresh des lignes
              majAndRefreshAgents(infos,event,agent,infos.previousAgent);

            } catch (e) {

              refreshLine(infos.previousAgent);
              toastr.warning('Déplacement en dehors du planning. Opération annulé');

            }

            toggleLoad();

          },
          drag: function(e,ui){
            var offset = dragElement.offset();
            var width = dragElement.width();

            var start = getMomentWithLeft(offset.left - 160);
            var end = addDurationToMoment(start,width);

            setElementTexte(dragElement,start.format('HH:mm') + ' - ' + end.format('HH:mm'));
          }
        });

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

      var width = Math.trunc(rowWidth / 5);

      for(var i = 0;i<5;i++){
        daysRange.append("<td width='"+width+"px'>"+moment(startDate).add(i,"days").date()+"</td>")
      }
    }

    function setAgentList(){
      var grid = paintGrid();
      agents.forEach(function(element){
        var string = "";
        string += "<tr class='agent' style='height:"+height+"px' data-agent='"+element+"'><td unselectable='on' onselectstart='return false;' onmousedown='return false;' class='name'>"+element+"</td> \
        <td class='grid'><table><tbody class='tRow'><tr>"+grid+"</tr></tbody></table></td></tr>";
        agentTable.append(string);
      });
    }

    function paintHours(){
      var i = moment('08','hh');
      var string = "";

      var pwidth = Math.trunc(rowWidth / 5);
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

      var pwidth = Math.trunc(rowWidth / 5);
      var cwidth = Math.trunc(pwidth/10);
      var qwidth = Math.trunc(cwidth/4);

      for(var x = 0;x<5;x++){
        //var day = moment().isoWeekday(1).add(x,'days').dates() + " ";
        string += "<td class='quarter' width='"+pwidth+"px'><table style='height:"+height+"px'><tbody><tr>";
        for(var i = 8;i<18;i++){
          //var hour = ("00" + i).slice(-2) + ":";
          string += "<td class='quarter-child' width='"+cwidth+"px'><table style='height:"+height+"px'><tbody><tr>";
          for(var j = 1;j<5;j++){
            //var date = day + hour + ("00" + j*15).slice(-2);data-date='"+date+"'
            string += "<td width='"+qwidth+"px'>";
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

    function putEventOnNewAgent(id,previousAgent,agent){
      agentsEvents[agent].addEvent(agentsEvents[previousAgent].events[id]);
      agentsEvents[previousAgent].removeEvent(id);
      return agentsEvents[agent].events[agentsEvents[agent].events.length - 1];
    }

    //calcule d'une heure
    function getMomentWithLeft(left,step){

      //Obtention du depart
      var hours = (left * 50) / rowWidth;

      //Obtention du nombre de jour de difference
      var days = parseInt( hours / 10 );
      var date = moment().isoWeekday(1).add(days,"days");

      //calcule de l'heure et des minutes de depart
      var hour = Math.floor((hours - (10*days))) + 8;
      var minutes = (hours - (10*days) - Math.floor((hours - (10*days)))) * 60;

      minutes = (15*Math.floor(minutes/15));

      if(minutes == 60){
        minutes = 0;
        hour += 1;
      }

      date.hour(hour);
      date.minutes(minutes);

      return date;
    }

    function getLeftWithMoment(date){

      return ((date.isoWeekday() - 1) * oneDay) + ((date.hour() - 8) * oneHour) + ((date.minutes() / 15)*oneQuarter);

    }

    function addDurationToMoment(date,width){

      var duration = Math.ceil((width * 50 / rowWidth) * 3600000);

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

      if(moment(date).add(minutes,"minutes").hour() >= 18 &&  moment(date).add(minutes,"minutes").minutes() > 0){
        date.add(1,"day");
        date.set("hour",8);
        minutes = minutes - (60 - date.minutes());
        date.set("minutes",0);
      }

      date.add(minutes,"minutes");

      return date;
    }

    function getAgentRow(agent){
      agent = parseInt(agent);
      return $('tr:nth-child('+(agent+1)+') .grid .tRow',agentTable);
    }

    function getTopHeight(idx,positionningArray){
      var beginningRow = undefined;
      var numberOfRow = 0;

      for(var i = 0;i<positionningArray.length;i++){
        if(positionningArray[i].includes(idx)){
          if(beginningRow == undefined)
            beginningRow = i;

          numberOfRow += 1;
        }
      }

      return {height : (height / positionningArray.length) * numberOfRow,
              top : (height / positionningArray.length) * beginningRow };
    }

    function toggleLoad(){
      loader.toggle();
    }

    function getDragElementInfo(dragElement){
      return { id : parseInt(dragElement.attr('data-index')),
        previousAgent : parseInt(dragElement.attr('data-agent')),
        offset : dragElement.offset(),
        width : dragElement.width()
      }
    }

    function hideEventRow(row){
      $('.event',row).hide();
    }

    function removeEventRow(row){
      $('.agent:nth-child('+(row+1)+') .tRow .event').remove();
      //$('.event',row).remove();
    }

    function getAgent(top){
      return Math.floor((top - 140) / height);
    }

    function setElementTexte(element,texte){
      $('p b',element).html(texte);
    }

    function majAndRefreshAgents(infos,event,agent,previousAgent=null){
      //Mise a jour des horaires
      var start = getMomentWithLeft(infos.offset.left - 160);
      var end = addDurationToMoment(start,infos.width);
      event.changeHoraires(
        start,
        end
      );
      if(start.date() != end.date()) agentsEvents[agent].cutElement(event);

      //Rafraichissement des différents
      refreshLine(agent);
      if(previousAgent != null && previousAgent != agent){
         removeEventRow(previousAgent);
         refreshLine(previousAgent);
      }
    }

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

  /*GESTION DU MODAL*/
  function generate_modal_body(){

    //Set Start Date
    var start = getMomentWithLeft(selector.offset().left - 158);
    $('#eventStart').data("DateTimePicker").date(start);

    //Set End Date
    var duration = selector.width();
    //var duration = rowWidth - Math.ceil(parseFloat(selector.css('right'))) - Math.ceil(parseFloat(selector.css('left')));
    var end = addDurationToMoment(start,duration);
    $('#eventEnd').data("DateTimePicker").date(end);

    //Afficher la duree de l'intervention
    var workTime = getWorkTime(moment(end).hour(18).diff(moment(start).hour(8),"days"),
                               end.diff(start,'seconds'));
    $('#displayDuree').html(workTime);

  }

  function getWorkTime(nbDays,totalHours){

    totalHours -= 14 * nbDays * 3600;

    var days = Math.floor(totalHours / 27900);
    if(days >= 1){
        totalHours = totalHours - (days * 27900);
    }
    var hours = Math.floor(totalHours / 3600);
    if(hours >= 1){
        totalHours = totalHours - (hours * 3600);
    }
    var minutes = Math.floor(totalHours / 60);

    return days + "J " + hours + "H " + minutes + "M";
  }


}( jQuery ));
