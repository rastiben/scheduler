class Event {

  constructor(parent,id,start,end,client,type,color,comments) {
    this.parent = parent;
    this.id = id;
    this.start = moment(start,"DD/MM/YYYY HH:mm");
    this.end = moment(end,"DD/MM/YYYY HH:mm");
    this.client = client;
    this.type = type;
    this.color = color;
    this.comments = comments;
  }

  changeHoraires(start,end){
    this.setStart(start);
    this.setEnd(end);
    this.parent.sortEvents();
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
      this.changeHoraires(values.start,values.end);
      this.client = values.clients;
      this.comments = values.comments;
  }

  setOId(o_id){
    this.o_id = o_id;
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

}
