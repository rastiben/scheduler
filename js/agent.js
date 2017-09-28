class Agent {

  constructor(values) {
    var self = this;

    for(var k in values){
      if(k == "events"){
        self.events = [];
        values.events.forEach(function(event){
          self.addEvent(event);
        });
      }else{
        this[k] = values[k];
      }
    }
    //this.events = [];
  }

  addEvent(event){
    var event = new Event(this,event);
    this.events.push(event);

    return event;
    //if(sort) this.sortEvents();
  }

  static _createEvent(staff_id,event){

    //test si l'evenement est cette semaine
    event.staff_id = staff_id;
    var self = this;
    var events = [];
    //Ajout en base
    $.ajax({
      type: "POST",
      url:"./ajax.php/scheduler",
      async: false,
      data:JSON.stringify(event),
      contentType: "application/json; charset=utf-8",
      success : function(data){
        data = JSON.parse(data);
        events = data;
        /*data.forEach(function(value,key){
          self.addEvent(value.ht);
        });*/
      },
      error : function(error){

      }
    });

    return events;
    //this.sortEvents();
  }

  static _createReccurence(staff_id,event){

    event.staff_id = staff_id;
    var self = this;
    var events = [];
    //Ajout en base
    $.ajax({
      type: "POST",
      url:"./ajax.php/scheduler/reccurence",
      async: false,
      data:JSON.stringify(event),
      contentType: "application/json; charset=utf-8",
      success : function(data){
        data = JSON.parse(data);
        events = data;
        /*data.forEach(function(value,key){
          self.addEvent(value.ht);
        });*/
      },
      error : function(error){

      }
    });

    return events;

  }

  removeEvent(id){
    this.events.splice(id,1);
    //this.sortEvents();
  }

  cutElement(event){
    /*var end = moment(event.end);
    var date = moment(event.start);
    var nbDays = 1;
    event.changeHoraires(event.start,moment(event.start).hour(18).minute(0));

    while (moment(date).add(1,'days').format("DD/MM/YYYY") != end.format("DD/MM/YYYY")) {
      if (date.isoWeekday() != 6 || date.isoWeekday() != 7) {
        var newEvent = jQuery.extend({}, event);
        delete newEvent.e_id;
        newEvent.start = moment(event.start).add(nbDays,"days").hour(8).minute(0).format('DD/MM/YYYY HH:mm');
        newEvent.end = moment(event.start).add(nbDays,"days").hour(18).minute(0).format('DD/MM/YYYY HH:mm');
        delete newEvent.parent;
        this._createEvent(newEvent);
      }

      date.add(1,'days');
      nbDays++;
    }

    var newEvent = jQuery.extend({}, event);
    newEvent.start = moment(event.start).add(nbDays,"days").hour(8).minute(0).format('DD/MM/YYYY HH:mm');
    newEvent.end = end.format('DD/MM/YYYY HH:mm');
    delete newEvent.parent;
    this._createEvent(newEvent);*/

  }

  sortEvents(){
    this.events.sort(this.compare);
  }

  compare(a,b){
    if(a.start.isAfter(b.start))
      return 1;
    if(a.start.isBefore(b.start))
      return -1;
    return 0;
  }

  static getAgents(week){

    var agents = [];
    var topics = [];

    $.ajax({
      type: "GET",
      url:"./ajax.php/staff",
      async: false,
      data: {
        week: week
      },
      contentType: "application/json; charset=utf-8",
      success : function(data){
        data = JSON.parse(data);
        topics = data.topics;
        data.agents.forEach(function(values,key){
          agents.push(new Agent(values));
        });
      },
      error : function(error){

      }
    });

    return {agents:agents,
            topics:topics};

  }

  setIdPlanning(id_planning,callback){
    var self = this;

    //if(self.id_planning != id_planning){
      $.ajax({
        type: "POST",
        url:"./ajax.php/staff/"+self.staff_id+"/planning/"+id_planning,
        contentType: "application/json; charset=utf-8",
        success : function(data){

          self.id_planning = id_planning;

        },
        error : function(error){

        }
      });
    /*} else if(callback != null){
      callback();
    }*/
  }

  static _getStaffPresta(p_id){

    var result = undefined;

    $.ajax({
      type: "GET",
      async:false,
      url:"./ajax.php/scheduler/staff/prestation/"+p_id,
      contentType: "application/json; charset=utf-8",
      success : function(data){
        result = JSON.parse(data);
      },
      error : function(error){

      }
    });

    return result;

  }

  _removeEvent(event_id){
    this.events[event_id]._remove();
    this.events.splice(event_id,1);
  }

}
