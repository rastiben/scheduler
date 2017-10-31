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
        'renderEditPlannificationLine': renderEditPlannificationLine,
        'instanciateDateTimePicker':instanciateDateTimePicker,
        'getTechs':getTechs
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
            return getContextMenuBuild(event);
          }
        });

      });

    };

    function getContextMenuBuild(event){
      return {
        items: {
            "fold1": {
              "name": "Etat",
              "items": {
                "fold3": {
                "name": "De l'événement",
                  "items": {
                      "fold3-key1": {"name": "Prévisionelle", "icon": event.status == 1 ? "fa-check"  : "", callback: function(){ event._changeEStatus(1); refreshPlanning(); }},
                      "fold3-key2": {"name": "Donnée", "icon": event.status == 2 ? "fa-check"  : "", callback: function(){ event._changeEStatus(2); refreshPlanning(); }},
                      "fold3-key3": {"name": "Validée", "icon": event.status == 3 ? "fa-check"  : "", callback: function(){ event._changeEStatus(3); refreshPlanning(); }}
                  }
                },
                "fold4": {
                "name": "De la prestation",
                  "items": {
                      "fold4-key1": {"name": "Prévisionelle", callback: function(){ event._changePStatus(1); refreshPlanning(); }},
                      "fold4-key2": {"name": "Donnée", callback: function(){ event._changePStatus(2); refreshPlanning(); }},
                      "fold4-key3": {"name": "Validée", callback: function(){ event._changePStatus(3); refreshPlanning(); }}
                  }
                }
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
        string += "<tr class='agent' id='"+element.staff_id+"' style='height:"+height+"px' data-agent='"+element.firstname + " " +  element.lastname +"'><td unselectable='on' onselectstart='return false;' onmousedown='return false;' class='name'><div class='infoS'><img src='../assets/avatar/"+element.avatar+"'><p>"+element.firstname + "<br>" +  element.lastname +"</p></div></td> \
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
    //var staffpresta = Object.keys(staffpresta).map(key => { return staffpresta[key]; });

    renderPlannification(staffpresta,null,null);


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

  function renderPlannification(agents,start,end){

    var div = "<div class='horaires col-md-12' style='display:none'>";

    div += "<div class='fixedThead col-md-12'><table class='table'><thead><th width='20%'>Technicien</th><th width='20%'>Début</th><th width='20%'>Fin</th><th width='10%'>Etat</th><th width='15%'>Modifier</th><th width='15%'>Supprimer</th></thead></table></div>\
    <div class='col-md-12'><div class='scrollableTable'><table class='table'><thead><th width='20%'></th><th width='20%'></th><th width='20%'></th><th width='10%'></th><th width='15%'></th><th width='15%'></th></thead><tbody>";

    /*events = agents.map(key => { return key.events; });
    events = [].concat.apply([], events);*/

    if(Array.isArray(agents)){
      agents.forEach(function(event,key){

        var staff_id = event.staff_id;
        var staff__avatar = event.staff__avatar != null ? event.staff__avatar : event.avatar;
        var staff__firstname = event.staff__firstname != null ? event.staff__firstname : event.firstname;
        var staff__lastname = event.staff__lastname != null ? event.staff__lastname : event.lastname;

        div += renderPlannificationLine(event.e_id,
                                        staff_id,
                                        event.status,
                                        event.start,
                                        event.end);

      });
    } else {
      var staff_id = agents.staff_id;
      var staff__avatar = agents.staff__avatar != null ? agents.staff__avatar : agents.avatar;
      var staff__firstname = agents.staff__firstname != null ? agents.staff__firstname : agents.firstname;
      var staff__lastname = agents.staff__lastname != null ? agents.staff__lastname : agents.lastname;

      div += renderPlannificationLine('',
                                      staff_id,
                                      1,
                                      start,
                                      end);
    }

    div += "</tbody></table></div><btn id='addPlannif' class='btn btn-success pull-right'>Ajouter une plannification</btn></div></div>";
    $('.modal-body').append(div);

    //instanciateDateTimePicker();

  }


  function renderPlannificationLine(e_id,staff_id,status,start,end){

    if(e_id == undefined || e_id == null) e_id = '';

    //Récupération de l'avatar
    var agent = agentsEvents.filter(key => key.staff_id == staff_id)[0];
    name = agent.firstname + " " + agent.lastname;
    avatar = agent != undefined ? agent.avatar : '';

    return "<tr id='"+e_id+"'> \
      <td id='"+staff_id+"'> \
        <p><img src='../assets/avatar/"+avatar+"'><span>"+ name +"</span></p>\
      </td> \
      <td> \
        <p>"+moment(start,"YYYY-MM-DD HH:mm").format("DD MMM YYYY HH:mm")+"</p>\
      </td> \
      <td> \
          <p>"+moment(end,"YYYY-MM-DD HH:mm").format("DD MMM YYYY HH:mm")+"</p>\
      </td> \
      <td id='"+status+"'>"+ getStatus(status) +"</td> \
      <td class='text-center'><btn class='editP btn btn-primary btn-sm'><span class='glyphicon glyphicon-edit'></span></btn></td> \
      <td class='text-center'><btn class='removeP btn btn-danger btn-sm'><span class='glyphicon glyphicon-trash'></span></btn></td></tr>";
  }

  function renderEditPlannificationLine(tr){

    var tech = $('td:nth-child(1)',tr).attr('id');
    var states = ["Prévisionelle","Donnée","Validée"];

    var techs = getTechs(tech);

    var start = moment($('td:nth-child(2)',tr).html(),"DD MMM YYYY HH:mm").format("YYYY-MM-DD HH:mm");
    var end = moment($('td:nth-child(3)',tr).html(),"DD MMM YYYY HH:mm").format("YYYY-MM-DD HH:mm");

    var state = $('td:nth-child(4)',tr).html();
    var status = states.map(function(key,index){
      var selected = (key == state ? "selected='selected'" : "" );
      return '<option id="'+(index+1)+'" '+selected+'>' + key + '</option>';
    });

    return " \
      <td id='"+tech+"'><select>"+techs+"</select></td> \
      <td><input class='datetimepicker' data-default-date='"+start+"'></td> \
      <td><input class='datetimepicker' data-default-date='"+end+"'></td> \
      <td><select>"+status+"</select></td> \
      <td class='text-center'><btn class='saveP btn btn-success btn-sm'><span class='glyphicon glyphicon-ok'></span></btn></td> \
      <td class='text-center'><btn class='cancelP btn btn-primary btn-sm'><span class='glyphicon glyphicon-remove'></span></btn></td></tr>";

  }

  function getTechs(tech){
    return agentsEvents.map(key => {
      var selected = (key.staff_id == tech ? "selected='selected'" : "" );
      return '<option id="'+key.staff_id+'" '+selected+'>' + key.firstname + ' ' + key.lastname + '</option>';
    });
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

  function getStatus(id){
    switch (id) {
      case 1:
        return "Prévisionelle"
        break;
      case 2:
        return "Donnée"
        break;
      case 3:
        return "Validée"
        break;
    }
  }

}( jQuery ));
