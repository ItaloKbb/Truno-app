import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CreateGameInput, GameState } from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';

@Component({
  selector: 'app-lobby',
  styleUrl: './lobby.css',
  templateUrl: './lobby.html',
})
export class Lobby {
  @Input({ required: true }) games!: GameService;
  @Output() navigate = new EventEmitter<string>();

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal('');

  protected createGame(name: string): void {
    const input: CreateGameInput = {
      name: name.trim(),
      maxPlayers: 4,
      initialCards: 3,
      roundReward: 10,
      emptyHandReward: 5,
      trophyPrice: 20,
    };

    if (input.name.length < 3) {
      this.errorMessage.set('Digite um nome com pelo menos 3 caracteres.');
      return;
    }

    this.run(this.games.create(input));
  }

  protected accessGame(code: string): void {
    if (!code.trim()) {
      this.errorMessage.set('Informe o código da partida.');
      return;
    }

    this.run(this.games.access(code));
  }

  private run(request: Observable<GameState>): void {
    this.pending.set(true);
    this.errorMessage.set('');

    request.subscribe({
      next: (game) => {
        this.pending.set(false);
        this.navigate.emit(`/partida/${game.id}`);
      },
      error: (error: unknown) => {
        this.pending.set(false);
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Não foi possível abrir a partida.',
        );
      },
    });
  }

}






