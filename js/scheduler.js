moment.locale('fr');

(function ( $ ) {

    var hours = [8,9,10,11,12,13,14,15,16,17];

    //EVENTS
    var events = [{
      agent: "Benoit Rastier",
      start: "14/08/2017 08:45",
      end: "14/08/2017 17:00",
    },{
      agent: "Lionel Tarlet",
      start: "16/08/2017 10:00",
      end: "17/08/2017 14:30",
    }];


    var shade = "#556b2f";
    var self = undefined;
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
        var scheduler = $(data);

        selector = $('.selector',scheduler);

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

        events.forEach(function(element){
          var where = $('tr[data-agent="'+element.agent+'"] .grid .row',agentTable);

          var start = moment(element.start,"DD/MM/YYYY HH:mm");
          var left = $('td[data-date="'+start.format('DD HH:mm')+'"]',where).offset().left - 160;

          var end = moment(element.end,"DD/MM/YYYY HH:mm");
          var right = $('td[data-date="'+end.format('DD HH:mm')+'"]',where);

          var right = ($(window).width() - right.offset().left) - right.width() - 2;

          where.append('<div class="event ui-widget ui-widget-content" style="left:'+left+'px;right:'+right+'px"> \
          <p>'+start.format("DD HH:mm")+' - '+end.format("DD HH:mm")+'</p></div>');
        });

        bindEvent(scheduler);

      });
    };

    function bindEvent(scheduler){

      //Change range date
      $(".changeDate .btn",scheduler).bind("click",function(){
        if($(this).attr('id') == "left"){
          date = startDate.add(-7,'days');
          setDateRange(date);
        } else {
          date = startDate.add(7,'days');
          setDateRange(date);
        }
      });

      //lorsque le clique de la souris est pressé
      $(".quarter",scheduler).mousedown(function(e) {
          // You can record the starting position with
          /*var self = this;*/

          if(resize == false && select == false){

          setSelectorGlyphiconDisplayed("none");
          select = true;

          var clickedElement = $(e.target);
          //var start_x = clickedElement.position().left;
          var start_x = clickedElement.offset().left;
          var scroll = $('.planning',scheduler).scrollTop();

          setSelectorDisplayed("block");
          setSelectorPosition(clickedElement.offset().top + scroll - 139
          ,start_x
          ,"auto");

          $(".planning",scheduler).mousemove(function(e) {
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

          $('.quarter',scheduler).trigger("mouseup",e);

        }

      });

      //Lorsque la souris est relaché
      $(".quarter",scheduler).mouseup(function(e,evt){

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
      $(".planning",scheduler).mouseleave(function(event){

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

      //resize is clicked
      /*$(".resizer",scheduler).mousedown(function(e) {
          // You can record the starting position with
          resize = $(this).closest('tr');
          direction = $(this).hasClass("resizeleft") ? "left" : "right";
          var clickedElement = $(this).closest('tr');
          //var start_x = clickedElement.position().left;
          var elementLeft = clickedElement.offset().left;
          var elementRight = clickedElement.offset().left + clickedElement.width();
          //var scroll = $('.planning',scheduler).scrollTop();

          clickedElement.width("auto");

          $(".planning",scheduler).mousemove(function(e) {
            if(direction == "right"){
              if(e.pageX >= elementLeft + 5){
                clickedElement.css({
                  'right':$(window).width() - e.pageX
                });
              }
            } else {
              if(e.pageX <= elementRight - 5){
                clickedElement.css({
                  'left':e.pageX - 160,
                  'right':$(window).width() - elementRight
                });
              }
            }
          });

      });*/

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

            newDate = elem.attr('data-date');
            if(axis == "e"){
              //Ajout d'un quart d'heure
              newDate = originalDates.substr(0,originalDates.indexOf(" - ")+1) + " - " + newDate;
            } else {
              newDate = newDate + " - " + originalDates.substr(originalDates.indexOf(" - ")+3);
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
      $(".event").draggable({
        start: function() {
          dragElement = $(this);
          dragElement.css({
            "left":"auto",
            "right":"auto",
            "width":$(this).width()
          });
        },
        stop: function(e) {
          dragElement.hide();
          $(document.elementFromPoint(e.pageX,e.pageY)).closest('.row').append(dragElement);
          dragElement.css({
            "top":""
          });
          dragElement.show();
        }
      });

      //Add calendar event
      $('.selector',scheduler).bind('click',function(){
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
        string += "<tr class='agent' data-agent='"+element+"'><td unselectable='on' onselectstart='return false;' onmousedown='return false;' class='name'>"+element+"</td> \
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
        string += "<td class='quarter' width='"+pwidth+"px'><table><tbody><tr>";
        for(var i = 8;i<18;i++){
          var hour = ("00" + i).slice(-2) + ":";
          string += "<td class='quarter-child' width='"+cwidth+"px'><table><tbody><tr>";
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

}( jQuery ));
