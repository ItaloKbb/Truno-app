import { Component, Input } from '@angular/core';
import { GameService } from '../../services/modules/game.service';
import { Observable } from 'rxjs';
import { GameState } from '../../domain/truno-api';

@Component({
  selector: 'app-partida',
  styleUrl: './partida.css',
  templateUrl: './partida.html',
})
export class Partida {
  @Input({ required: true }) partidaId!: number;
  @Input({ required: true }) service!: GameService;

  game$!: Observable<GameState>;
  players$!: Observable<GameState>;

  ngOnInit() {
    this.game$ = this.service.getState(this.partidaId);
  }

  getState(gameId: number): Observable<GameState> {
    return this.service.getState(gameId);
  }
}