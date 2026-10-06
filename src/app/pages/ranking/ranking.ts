import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-ranking',
  styleUrls: ['./ranking.css', '../lobby/lobby.css'],
  templateUrl: './ranking.html',
})
export class Ranking {
  @Output() navigate = new EventEmitter<string>();


  go(event: Event, url: string): void {
    event.preventDefault();
    this.navigate.emit(url);
  }
}
