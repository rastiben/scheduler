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
      event.title,
      event.type,
      event.color
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
    var daysDiffWithoutWeekEnd = this.daysDiff(moment(event.start).hour(8).minute(0),moment(end).hour(18).minute(0));
    var daysDiff = moment(end).hour(18).minute(0).diff(moment(event.start).hour(8).minute(0),'days');

    event.changeHoraires(event.start,moment(event.start).hour(18).minute(0));

    for(var i=1;i<daysDiffWithoutWeekEnd;i++){

      if(moment(event.start).add(i,"days").isoWeekday() == 6){
        i += 2;
        //daysDiff += 2;
      }

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

  }

  daysDiff(start,end){
    var date = moment(start); // use a clone
    var nbDays = 0;
    while (date < end) {
      if(date.month() == end.month() && date.date() == end.date())
        break;

      nbDays++;
      if (date.isoWeekday() == 6 || date.isoWeekday() == 7) {
        nbDays--;
      }

      date.add(1,'days');
    }
    return nbDays;
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
