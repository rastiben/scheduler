class Event {

  constructor(parent,id,start,end,title,type,color) {
    this.parent = parent;
    this.id = id;
    this.start = moment(start,"DD/MM/YYYY HH:mm");
    this.end = moment(end,"DD/MM/YYYY HH:mm");
    this.title = title;
    this.type = type;
    this.color = color;
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

}
