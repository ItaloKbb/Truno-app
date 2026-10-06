import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { cardAsset, type GameCard, type GameState } from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';

@Component({
  selector: 'app-partida',
  styleUrl: './partida.css',
  templateUrl: './partida.html',
})
export class Partida implements OnChanges {
  @Input({ required: true }) partidaId!: number;
  @Input({ required: true }) service!: GameService;

  public readonly game = signal<GameState | null>(null);
  public readonly loading = signal(true);
  public readonly pending = signal(false);
  public readonly errorMessage = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['partidaId']) return;

    if (!Number.isInteger(this.partidaId) || this.partidaId <= 0) {
      this.loading.set(false);
      this.errorMessage.set('Identificador de partida inválido.');
      this.game.set(null);
      return;
    }

    this.load();
  }

  public load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.service.getState(this.partidaId).subscribe({
      next: (game) => {
        this.game.set(game);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(error instanceof Error ? error.message : 'Falha ao carregar a partida.');
      },
    });
  }

  public cardImage(card: GameCard | null): string {
    if (!card) return '/assets/cards/reverso.png';
    return cardAsset(card.valor, card.naipe);
  }

  public winnerName(game: GameState): string {
    const winner = game.players.find((player) => player.id === game.winnerPlayerId);
    return winner ? winner.nickname : '—';
  }

  public currentPlayerName(game: GameState): string {
    const current = game.players.find((player) => player.id === game.currentPlayerId);
    return current ? current.nickname : '—';
  }

  public play(handCardId: number | null): void {
    if (handCardId === null) return;
    this.run(this.service.playCard(this.partidaId, handCardId));
  }

  public start(): void {
    this.run(this.service.start(this.partidaId));
  }

  public answerPuzzle(challengeId: number, alternativeIndex: number): void {
    this.run(this.service.answerPuzzle(this.partidaId, challengeId, alternativeIndex));
  }

  public buyTrophy(): void {
    this.run(this.service.buyTrophy(this.partidaId));
  }

  public readyForNextRound(): void {
    this.run(this.service.readyForNextRound(this.partidaId));
  }

  public cancel(): void {
    this.run(this.service.cancel(this.partidaId));
  }

  private run(request: Observable<GameState>): void {
    this.pending.set(true);
    this.errorMessage.set('');

    request.subscribe({
      next: (updated) => {
        this.game.set(updated);
        this.pending.set(false);
      },
      error: (error: unknown) => {
        this.pending.set(false);
        this.errorMessage.set(error instanceof Error ? error.message : 'A ação não pôde ser concluída.');
      },
    });
  }
}