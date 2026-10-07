import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Resultado de uma rodada encerrada; `nickname` nulo quando houve empate. */
export interface RoundResult {
  roundNumber: number;
  nickname: string | null;
  isMe: boolean;
  coins: number;
  trophies: number;
}

/** Anúncio central de quem venceu a rodada e o que ganhou. */
@Component({
  selector: 'app-round-banner',
  styleUrl: './round-banner.css',
  templateUrl: './round-banner.html',
})
export class RoundBanner {
  @Input({ required: true }) result!: RoundResult;
  @Output() readonly dismissed = new EventEmitter<void>();

  get initial(): string {
    return [...(this.result.nickname ?? '').trim()][0]?.toUpperCase() ?? '?';
  }

  get title(): string {
    if (!this.result.nickname) return 'Rodada empatada';
    return this.result.isMe ? 'Você venceu a rodada!' : `${this.result.nickname} venceu a rodada`;
  }
}
