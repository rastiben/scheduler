class Agent {

  constructor(nom, prenom) {
    this.nom = nom;
    this.prenom = prenom;
    this.events = [];
  }

  addEvent(event){
    var event = new Event(
      this,
      event.id,
      event.start,
      event.end,
      event.client,
      event.type,
      event.color,
      event.comments
    );
    this.events.push(event);

    return event;
    //if(sort) this.sortEvents();
  }

  createEvent(event){

    //test si l'evenement est cette semaine
    event = this.addEvent(event);
    this.sortEvents()

    //Ajout en base

    return event;
  }

  removeEvent(id){
    this.events.splice(id,1);
    //this.sortEvents();
  }

  cutElement(event){
    var end = moment(event.end);
    var date = moment(event.start);
    var nbDays = 1;
    event.changeHoraires(event.start,moment(event.start).hour(18).minute(0));

    while (moment(date).add(1,'days').format("DD/MM/YYYY") != end.format("DD/MM/YYYY")) {
      if (date.isoWeekday() != 6 || date.isoWeekday() != 7) {
        this.createEvent({
          id:event.id,
          start:moment(event.start).add(nbDays,"days").hour(8).minute(0),
          end:moment(event.start).add(nbDays,"days").hour(18).minute(0),
          client:event.client,
          type:event.type,
          color:event.color
        });
      }

      date.add(1,'days');
      nbDays++;
    }

    this.createEvent({
      id:event.id,
      start:moment(event.start).add(nbDays,"days").hour(8).minute(0),
      end:end,
      client:event.client,
      type:event.type,
      color:event.color
    });
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
