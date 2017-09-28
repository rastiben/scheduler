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
    var dateRange = undefined;
    var daysRange = undefined;
    var hoursRange = undefined;
    var agentTable = undefined;
    var loader = undefined;
    var selector = undefined;
    var selectorActive = false;
    var ttotal = 0;
    var valuesClickedItem = undefined;
    var topics = undefined;
    var week = undefined;

    //Event
    var direction = undefined;
    var select = false;
    var resize = false;

    //calcule longeur des horaires
    var rowWidth = undefined;
    var oneDay = undefined;
    var oneHour = undefined;
    var oneQuarter = undefined;

    /*Variable copier coller*/
    var event_to_copy = undefined;
    var width_copied_event = undefined;


    $.fn.scheduler = function() {
      self = this;

      //Récupération du loader
      loader = $(".loaders");

      //init(this);
      week = moment().isoWeekday(1);

      //Récupération des agents
      agentsEvents = Agent.getAgents(week.format('DD/MM/YYYY'));
      topics = agentsEvents.topics;
      agentsEvents = agentsEvents.agents;

      //agents[0].setIdPlanning(14);
      topics.forEach(function(element,idx){
        $('html > head').append("<style> .event[data-type='"+element.topic_id+"'] div {background : "+element.couleur+"} </style>");
      });

      //Refresh planning when window resize
      var callbackBindEvent = bindGlobalEvent;
      var resizeTimeout;
      $( window ).resize(function() {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(function(){
          init(null,callbackBindEvent);
          callbackBindEvent = null;
        },100);
      });

      /*GESTION DU MODAL*/
      /*$('#editEventModal').on('shown.bs.modal', function(e) {
          valuesClickedItem;
          if(selector.css('display') != 'none') generate_new_modal_body();
      });*/

      return {
        'addEvent': addEvent,
        'addReccurence':addReccurence,
        'managePresta': managePresta,
        'getAgentsEvents': getAgentsEvents,
        'getTopics': getTopics,
        'refreshPlanning': refreshPlanning,
        'renderPlannification':renderPlannification,
        'renderPlannificationLine':renderPlannificationLine,
        'instanciateDateTimePicker':instanciateDateTimePicker
      };
    };

    function getAgentsEvents(){
      return agentsEvents;
    }

    function getTopics(){
      return topics;
    }

    function init(obj,callback){

      $.get("./planning/assets/templates/scheduler.tmpl.html", function(data){

        rowWidth = $(window).width() - 160;
        oneDay = rowWidth / 5;
        oneHour = oneDay / 10;
        oneQuarter = oneHour / 4;

        height = ($(window).height() - 144) / agentsEvents.length;

        var t1 = performance.now();

        scheduler = $(data);

        selector = $('.selector',scheduler);
        selector.height(height);
        $('.glyphicon',selector).css('line-height',height + "px");

        $(".planning",scheduler).css({'height':$(window).height()-141});

        var t1 = performance.now();

        //Set Hour
        dateRange = $(".dateRange");
        daysRange = $(".days tbody tr");
        setDateRange();

        //paintHours
        paintHours();

        //Set agents list
        agentTable = $(".agents",scheduler);
        setAgentList();

        $(self).html(scheduler);

        //A ne pas faire lors d'un init

        for(var i=0;i<agentsEvents.length;i++){
          refreshLine(i);
        }

        bindEvent(scheduler);

        //tippy('.event');

        if(callback != null) callback();

      });

    };

    function refreshPlanning(){
      agentsEvents = Agent.getAgents(week.format("DD/MM/YYYY")).agents;
      agentsEvents.forEach(function(value,key){
        refreshLine(key);
      });
    }

    function refreshLine(agent){

      //Reorganiser tableau element.
      removeEventRow(agent);

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
      data-size="big" client="'+element.client+'" data-agent="'+agent+'" \
      data-index="'+idx+'" data-type='+element.topic_id+' class="event ui-widget ui-widget-content" \
      style="height:'+topHeight.height+'px;top:'+topHeight.top+'px;left:'+left+'px;right:'+right+'px;background:linear-gradient(to top,'+element.topic__couleur+','+LightenDarkenColor(element.topic__couleur,50)+');"> \
      <div id="contextMenu"><p style="color:white"><b>'+start.format("HH:mm")+' - '+end.format("HH:mm")+'</b></p> \
      <img src="./planning/assets/status/'+element.status+'.gif"></div></div>');

    }

    function bindGlobalEvent(){

      selector
      .off("click")
      .on("click",function(){
        generate_new_modal_body();
      });

      //Change range date
      $(".changeDate .btn",document)
      .off("click")
      .on("click",function(){
        console.log("clicked");
        if($(this).attr('id') == "left"){
          date = week.add(-7,'days');
          setDateRange();
        } else {
          date = week.add(7,'days');
          setDateRange();
        }

        refreshPlanning();

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

      //Sort agents
      $( ".agents" ).sortable({
        handle:".name",
        start: function (e , ui){
           $(ui.item).addClass("sorting");
        },
        stop: function(e, ui){

          var t1 = performance.now();

          loader.toggle();

          //$(ui.item).removeClass("sorting");

          var array = $(".agent").toArray();
          var length = array.length;

          var newAgentsEvents = [];

          array.forEach(function(value,key){

            //Staff_id
            var staff_id = $(value).attr('id');

            //Find concerned agent
            var agent = agentsEvents.find(function(agent){
              return agent.staff_id == staff_id;
            });

            //Change position in planning
            agent.setIdPlanning(key+1);

            newAgentsEvents.push(agent);

          });

          agentsEvents = newAgentsEvents;

          //Refresh
          agentsEvents.forEach(function(element,idx){
            refreshLine(idx);
          });

          loader.toggle();
          toastr.success("Listes des techniciens mise à jour.");

        }
      });


      $.contextMenu({
        selector: ".selector",
        zIndex: 10000,
        build: function($trigger, e) {
          return getContextMenuBuild();
        }
      });

      //Add calendar event
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
              //removeEventRow(agent);

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

            var infos = undefined;

            try {

              //Affichage du chargement
              toggleLoad();

              //Récupération des informations
              infos = getDragElementInfo(dragElement);

              //Masquer les evenements de la ligne
              agent = getAgent(e.pageY);
              if(agent < 0) throw "Out of planning";
              //removeEventRow(agent);

              //Récupération de l'événement
              var event = agentsEvents[infos.previousAgent].events[infos.id];

              //Mise a jour de l'element et refresh des lignes
              majAndRefreshAgents(infos,event,agent);

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

        $(elem).on('click',function(e){

          $('#editEventModal').modal({
            backdrop: 'static',
            keyboard: false
          });
          $(elem).css('z-index','auto');

          valuesClickedItem = {
            agent:parseInt($(elem).attr('data-agent')),
            index:parseInt($(elem).attr('data-index'))
          };

          generate_existing_modal_body();

        });

        var agent = $(elem).attr("data-agent");
        var event = agentsEvents[agent].events[$(elem).attr("data-index")];
        $(elem).contextMenu({
          selector: "#contextMenu",
          zIndex: 10000,
          build: function($trigger, e) {
            return getContextMenuBuild();
          }
        });

      });

    };

    function getContextMenuBuild(){
      return {
        items: {
            "fold1": {
            "name": "Etat",
                "items": {
                    "fold1-key1": {"name": "Prévisionelle", "icon": event.status == 1 ? "fa-check"  : "", callback: function(){ event._changeStatus(1); refreshPlanning(); }},
                    "fold1-key2": {"name": "Donnée", "icon": event.status == 2 ? "fa-check"  : "", callback: function(){ event._changeStatus(2); refreshPlanning(); }},
                    "fold1-key3": {"name": "Validée", "icon": event.status == 3 ? "fa-check"  : "", callback: function(){ event._changeStatus(3); refreshPlanning(); }}
                }
            },
            "sep1": "---------",
            "fold2": {
            "name": "Envoyez un mail",
                "items": {
                    "fold2-key1": {"name": "Aux techniciens"},
                    "fold2-key2": {"name": "Au commercial"},
                    "fold2-key3": {"name": "Au client"}
                }
            },
            "sep2": "---------",
            "copy" : {name: "Copier", icon: "copy", callback: copyElement},
            "paste": {name: "Coller", icon: "paste", callback: pasteElement},
            "delete": {name: "Supprimer cette plannification", icon: "delete", callback: removeElement}
          }
      }
    }

    function setDateRange(){
      var date = week.format("DD MMM YYYY") + " - " + moment(week).add(4,'days').format("DD MMM YYYY");
      dateRange.html(date);
      setDays();
    };

    function setDays(){
      daysRange.empty();

      var width = Math.trunc(rowWidth / 5);

      for(var i = 0;i<5;i++){
        daysRange.append("<td width='"+width+"px'>"+moment(week).add(i,"days").date()+"</td>")
      }
    }

    function setAgentList(){
      var grid = paintGrid();
      agentsEvents.forEach(function(element){
        var string = "";
        string += "<tr class='agent' id='"+element.staff_id+"' style='height:"+height+"px' data-agent='"+element.firstname + " " +  element.lastname +"'><td unselectable='on' onselectstart='return false;' onmousedown='return false;' class='name'>"+element.firstname + " " +  element.lastname +"</td> \
        <td class='grid'><table><tbody class='tRow'><tr>"+grid+"</tr></tbody></table></td></tr>";
        agentTable.append(string);
      });
    }

    function paintHours(){
      $(".hours tbody tr").empty();

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
      $(".hours tbody tr").append(string);
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

    /*function putEventOnNewAgent(id,previousAgent,agent){
      agentsEvents[agent].addEvent(agentsEvents[previousAgent].events[id]);
      agentsEvents[previousAgent].removeEvent(id);
      return agentsEvents[agent].events[agentsEvents[agent].events.length - 1];
    }*/

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


      return {height : ((height * 0.9) / positionningArray.length) * numberOfRow,
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

    function majAndRefreshAgents(infos,event,agent){
      //Mise a jour des horaires
      var start = getMomentWithLeft(infos.offset.left - 160);
      var end = addDurationToMoment(start,infos.width);


      Event._changeHoraires(event.e_id,start,end);
      Event._setStaff(event.e_id,agentsEvents[agent].staff_id);

      //Rafraichissement du planning
      refreshPlanning();
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
  function generate_new_modal_body(){

    //Set Start Date
    var start = getMomentWithLeft(selector.offset().left - 158);

    var duration = selector.width() - 2;
    //var duration = rowWidth - Math.ceil(parseFloat(selector.css('right'))) - Math.ceil(parseFloat(selector.css('left')));
    var end = addDurationToMoment(start,duration);

    var agent = agentsEvents[getAgent(selector.offset().top)];

    //RENDER plannification
    renderPlannification(agent,start,end);

    //Affichage du titre
    $('#title').html('Ajout d\'un événement');

    //$('#editEventModal').modal('show');

  }

  function generate_existing_modal_body(){
    var event = agentsEvents[valuesClickedItem.agent].events[valuesClickedItem.index];
    /*$('#eventStart').data("DateTimePicker").date(event.start);
    $('#eventEnd').data("DateTimePicker").date(event.end);*/
    $('#client').val(event.client);
    $('#comments').val(event.comments);
    $('#title').html('Modification d\'un événement');
    $('#manageEvent').attr('p_id',event.p_id);

    //Récupération des horaires de chaque événement de la plannification

    var staffpresta = Agent._getStaffPresta(event.p_id);
    $.each(staffpresta,function(key,value){

      renderPlannification(value,null,null,value.events);

    });

  }

  //Ajout d'un événement
  function addEvent(staff_id,values,callback){
    var events = Agent._createEvent(staff_id,values);

    if(callback != null) callback(events);
  }

  function addReccurence(staff_id,values,callback){
    var events = Agent._createReccurence(staff_id,values);

    if(callback != null) callback(events);
  }

  function managePresta(values){

    Event._updateValues(values);

  }

  /*EVENEMENTS CONTEXT MENU*/
  function copyElement(itemKey, opt){
    event_to_copy = $(opt.context);
    var agent_id = event_to_copy.attr('data-agent');
    var event_id = event_to_copy.attr('data-index');
    width_copied_event = event_to_copy.width();

    event_to_copy = agentsEvents[agent_id].events[event_id];

    //toastr.success("Copie de l'élément réussi");
  }

  function pasteElement(){

    //Date de commencement
    var start = getMomentWithLeft($('.selector').offset().left - 158);
    var end = addDurationToMoment(start,width_copied_event);

    var staff_id = agentsEvents[getAgent($('.selector').offset().top)].staff_id;

    addEvent(staff_id,{
      start:start.format("DD/MM/YYYY HH:mm"),
      end:end.format("DD/MM/YYYY HH:mm"),
      topic_id:event_to_copy.topic_id,
      client:event_to_copy.client,
      comments:event_to_copy.comments
    });

    refreshPlanning();

    toastr.success("Copie effectué");

  }

  function removeElement(itemKey, opt){

    /*var callback = function(e){
      if($(e.target).hasClass('yesBtn')){
        var event_to_delete = $(opt.$trigger);
        var agent_id = parseInt(event_to_delete.attr('data-agent'));
        var event_id = parseInt(event_to_delete.attr('data-index'));

        agentsEvents[agent_id]._removeEvent(event_id);

        refreshLine(agent_id);
      }
    }*/
    var elementTriggered = $(opt.context);

    var toast = toastr.warning('<div><div><button type="button" id="yesBtn" class="btn btn-danger">Supprimer</button><button type="button" id="noBtn" class="btn btn-primary" style="margin: 0 8px 0 8px">Annuler</button></div>',
                   'Voulez vous vraiment supprimer cette plannification ?',
                   {"closeButton": false,
                    "debug": false,
                    "newestOnTop": false,
                    "progressBar": false,
                    "positionClass": "toast-bottom-center",
                    "preventDuplicates": false,
                    "tapToDismiss": false,
                    "onclick": null,
                    "onShown": function(){
                      $('#yesBtn').click(function(){
                        var agent_id = parseInt(elementTriggered.attr('data-agent'));
                        var event_id = parseInt(elementTriggered.attr('data-index'));

                        agentsEvents[agent_id]._removeEvent(event_id);

                        refreshLine(agent_id);

                        $(toast).fadeOut(1000, function(){ $(toast).remove(); })
                      });

                      $('#noBtn').click(function(){
                        $(toast).fadeOut(1000, function(){ $(toast).remove(); })
                      });
                    },
                    "showDuration": "300",
                    "hideDuration": "1000",
                    "timeOut": "0",
                    "extendedTimeOut": "0",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"});

    //$('#yesBtn').click(function())

  }

  function renderPlannification(agent,start,end,events){

    var staff_id = agent.staff_id;
    var staff__avatar = agent.staff__avatar != null ? agent.staff__avatar : agent.avatar;
    var staff__firstname = agent.staff__firstname != null ? agent.staff__firstname : agent.firstname;
    var staff__lastname = agent.staff__lastname != null ? agent.staff__lastname : agent.lastname;

    $('#groupTechs ul li:last-child').before("<li id='s"+agent.staff_id+"' style=\"background-image: url('../assets/avatar/"+staff__avatar+"')\"></li>");

    var div = "<div style='display:none' class='horaires col-md-12' id='s"+staff_id+"' class='form-group col-md-12'> \
    <div class='planifInfo col-md-12'><img src='../assets/avatar/"+staff__avatar+"'> \
    <h4>Plannification pour " + staff__firstname + " " + staff__lastname + "</h4></div>";

    div += "<div class='fixedThead col-md-12'><table class='table'><thead><th width='30%'>Début</th><th width='30%'>Fin</th><th width='20%'>Sauvegarder</th><th width='20%'>Supprimer</th></thead></table></div>\
    <div class='col-md-12'><div class='scrollableTable'><table class='table'><thead><th width='30%'></th><th width='30%'></th><th width='20%'></th><th width='20%'></th></thead><tbody>";

    if(events != undefined){
      $.each(events,function(key,event){
        div += renderPlannificationLine(event.start,event.end,event.e_id);
      });
    } else {
      div += renderPlannificationLine(start.format("YYYY/MM/DD HH:mm"),end.format("YYYY/MM/DD HH:mm"));
    }

    div += "</tbody></table></div><btn id='addPlannif' class='btn btn-success pull-right'>Ajouter une plannification</btn></div></div>";

    $('.modal-body').append(div);

    instanciateDateTimePicker();

  }


  function renderPlannificationLine(start,end,e_id){

    return "<tr id='"+e_id+"'><td> \
      <input required type='text' data-default-date='"+start+"' data-required-error='Selectionner une date de début' class='form-control datetimepicker' id='eventStart' placeholder='Date de début'> \
      </td> \
      <td> \
        <input required type='text' data-default-date='"+end+"' data-required-error='Selectionner une date de fin' class='form-control datetimepicker' id='eventEnd' placeholder='Date de fin'> \
      </td> \
      <td></td> \
      <td><btn class='btn btn-danger'><span class='glyphicon glyphicon-remove'></span></btn></td></tr>";
  }

  function instanciateDateTimePicker(){

    $('.datetimepicker').each(function(i,e){
      date = $(e).attr('data-default-date') != 'null' ? $(e).attr('data-default-date') : moment();

      $(e).datetimepicker({
        stepping:15,
        format:"DD/MM/YYYY HH:mm",
        locale: 'fr',
        defaultDate: date,
        daysOfWeekDisabled: [0,6]
      });
    });

  }

}( jQuery ));
