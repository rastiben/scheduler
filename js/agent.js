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
    //this.sortEvents();
  }

  removeEvent(id){
    this.events.splice(id,1);
    //this.sortEvents();
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
