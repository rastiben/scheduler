class Agent {

  constructor(nom, prenom) {
    this.nom = nom;
    this.prenom = prenom;
    this.events = [];
  }

  addEvent(event){
    this.events.push(new Event(
      this,
      event.id,
      event.start,
      event.end,
      event.title,
      event.type,
      event.color
    ));
    //if(sort) this.sortEvents();
  }

  createEvent(event){

    this.addEvent(event);

    //Ajout en base
  }

  removeEvent(id){
    this.events.splice(id,1);
    //this.sortEvents();
  }

  cutElement(event){

    var end = moment(event.end);
    var daysDiff = moment(end).hour(18).minute(0).diff(moment(event.start).hour(8).minute(0),'days');

    event.changeHoraires(event.start,moment(event.start).hour(18).minute(0));

    for(var i=1;i<daysDiff;i++){
      this.createEvent({
        id:event.id,
        start:moment(event.start).add(i,"days").hour(8).minute(0),
        end:moment(event.start).add(i,"days").hour(18).minute(0),
        title:event.title,
        type:event.type,
        color:event.color
      });
    }

    this.createEvent({
      id:event.id,
      start:moment(event.start).add(daysDiff,"days").hour(8).minute(0),
      end:end,
      title:event.title,
      type:event.type,
      color:event.color
    });

    this.sortEvents()

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

}
