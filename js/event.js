class Event {

  constructor(parent,values) {

    this.parent = parent;

    for(var k in values){
      if(k == "start" || k == "end")
        this[k] = moment(values[k],"YYYY-MM-DD HH:mm");
      else
        this[k] = values[k];
    }

  }

  changeHoraires(start,end){

    var self = this;

    $.ajax({
      type: "POST",
      url:"./ajax.php/scheduler/"+self.e_id+"/change_horaires",
      async: false,
      data:{
        start:start.format('YYYY-MM-DD HH:mm'),
        end:end.format('YYYY-MM-DD HH:mm')
      },
      success : function(data){
        self.setStart(start);
        self.setEnd(end);
      },
      error : function(error){

      }
    });

    this.parent.sortEvents();
  }

  static _changeHoraires(e_id,start,end,callback){

    $.ajax({
      type: "POST",
      url:"./ajax.php/scheduler/"+e_id+"/change_horaires",
      async: false,
      data:{
        start:start.format('YYYY-MM-DD HH:mm'),
        end:end.format('YYYY-MM-DD HH:mm')
      },
      success : function(data){
        toastr.success("Mise à jour de l'horaire réussi");
        if(callback) callback(data != null ? JSON.parse(data) : null);
      },
      error : function(error){

      }
    });

  }


  setStart(start){
    this.start = start;
    this.start.second(0);
    this.start.millisecond(0);
  }

  setEnd(end){
    this.end = end;
    this.end.second(0);
    this.end.millisecond(0);
  }

  setValues(values){
    Event._updateValues(values);
  }

  static _setStaff(e_id,staff_id){

    $.ajax({
      type: "POST",
      async: false,
      url:"./ajax.php/scheduler/prestation/"+e_id+"/staff/"+staff_id,
      contentType: "application/json; charset=utf-8",
      success : function(data){
        //toastr.success('Status modifié');
      },
      error : function(error){

      }
    });

  }

  setOId(o_id){
    this.o_id = o_id;
  }

  _changeStatus(status){

    var self = this;

    $.ajax({
      type: "POST",
      async: false,
      url:"./ajax.php/scheduler/prestation/"+self.p_id+"/status/"+status,
      contentType: "application/json; charset=utf-8",
      success : function(data){
        self.status = status;
        toastr.success('Status modifié');
      },
      error : function(error){

      }
    });

  }

  _save(){

    $.ajax({
      type: "POST",
      url:"",
      data : JSON.stringify(this),
      contentType: "application/json; charset=utf-8",
      success : function(data){

      },
      error : function(error){

      }
    });

  }

  static _updateValues(values){

    $.ajax({
      type: "POST",
      url:"./ajax.php/scheduler/prestation/"+values.p_id+"/update_values",
      data : JSON.stringify(values),
      contentType: "application/json; charset=utf-8",
      success : function(data){

      },
      error : function(error){

      }
    });

  }

  _changeAgent(agent){

    var self = this;

    $.ajax({
      type: "POST",
      url:"./ajax.php/scheduler/prestation/"+self.p_id+"/update_values",
      data : JSON.stringify(values),
      contentType: "application/json; charset=utf-8",
      success : function(data){

      },
      error : function(error){

      }
    });

  }

  _remove(){

    var self = this;
    //ajax call
    $.ajax({
      type: "DELETE",
      url:"./ajax.php/scheduler/remove/"+self.e_id,
      contentType: "application/json; charset=utf-8",
      success : function(data){
        toastr.success("Evenement supprimé");
      },
      error : function(error){

      }
    });

  }

}
