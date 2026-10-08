import { Component, Input } from '@angular/core';
import { skillIconAsset, type GameDirection, type SkillType, type TheftKind } from '../../domain/truno-api';

/** Cor do brilho de cada habilidade no efeito de giro. */
const SKILL_GLOW: Record<SkillType, string> = {
  BLOCK: '#ff4d4d',
  THEFT: '#4fd17a',
  INVERTS: '#b57bff',
  BUY: '#5ec8ff',
  BURN: '#ff8a2b',
  SURPRISE: '#ff6fd0',
  PUZZLE: '#ffd84a',
  CHANGEOFHANDS: '#3fe0c5',
  BOMB: '#ffb23f',
  SHIELD: '#4f8cff',
};

/** Ícone da habilidade atravessando a tela; não captura cliques. */
@Component({
  selector: 'app-skill-burst',
  styleUrl: './skill-burst.css',
  templateUrl: './skill-burst.html',
  host: {
    'aria-hidden': 'true',
    '[style.--glow]': 'glow',
    '[style.--burst-size.px]': 'burstSize',
    '[style.--particle-distance.px]': 'particleDistance',
    '[class.is-surprise]': 'isSurprise',
    '[class.is-buy]': 'isBuy',
    '[class.is-puzzle]': 'isPuzzle',
    '[class.is-theft]': 'isTheft',
    '[class.is-bad]': 'isBad',
    '[class.is-strong]': 'power >= 3',
  },
})
export class SkillBurst {
  @Input({ required: true }) type!: SkillType;
  @Input() direction: GameDirection | null = null;
  @Input() roll: number | null = null;
  @Input() coinDelta: number | null = null;
  @Input() cardsDrawn: number | null = null;
  @Input() theftKind: TheftKind | null = null;
  @Input() theftAmount: number | null = null;
  @Input() theftBlocked = false;
  /** Nulo na abertura do desafio; definido no efeito da resposta. */
  @Input() puzzleCorrect: boolean | null = null;
  @Input() puzzleAmount: number | null = null;

  private _power = 1;
  particles: number[] = [];

  @Input() set power(value: number) {
    this._power = Math.max(1, Math.min(4, value));
    this.particles = Array.from({ length: this._power * 6 }, (_, index) => index);
  }

  get power(): number {
    return this._power;
  }

  get isSurprise(): boolean {
    return this.type === 'SURPRISE';
  }

  get isBuy(): boolean {
    return this.type === 'BUY';
  }

  get isTheft(): boolean {
    return this.type === 'THEFT';
  }

  /** Itens que voam do alvo (direita) para quem roubou (esquerda). */
  get theftItems(): number[] {
    if (this.theftBlocked) return [];
    const count = Math.max(0, Math.min(this.power, this.theftAmount ?? this.power));
    return Array.from({ length: count }, (_, index) => index);
  }

  get theftOutcomeText(): string {
    if (this.theftBlocked) return '🛡️ Bloqueado';
    const amount = this.theftAmount ?? 0;
    return `+${amount} ${this.theftKind === 'COIN' ? '🪙' : '🂠'}`;
  }

  get isPuzzle(): boolean {
    return this.type === 'PUZZLE';
  }

  get isPuzzleResult(): boolean {
    return this.isPuzzle && this.puzzleCorrect !== null;
  }

  get puzzleOutcomeText(): string {
    const amount = this.puzzleAmount ?? this.power;
    return this.puzzleCorrect ? `+${amount} 🪙` : `+${amount} 🂠`;
  }

  get buyCards(): number[] {
    const count = Math.max(0, Math.min(this.power, this.cardsDrawn ?? this.power));
    return Array.from({ length: count }, (_, index) => index);
  }

  get buyOutcomeText(): string {
    const count = this.cardsDrawn ?? this.power;
    return `${count > 0 ? '+' : ''}${count} 🂠`;
  }

  get isBad(): boolean {
    return (this.isSurprise && this.roll !== null && this.roll < 0) || (this.isPuzzle && this.puzzleCorrect === false);
  }

  get burstSize(): number {
    return 100 + this.power * 26;
  }

  get particleDistance(): number {
    return 50 + this.power * 22;
  }

  get outcomeText(): string {
    const change = this.coinDelta ?? this.roll ?? 0;
    return `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)} 🪙`;
  }

  get iconAsset(): string {
    return skillIconAsset(this.type, { surpriseRoll: this.roll, direction: this.direction });
  }

  get glow(): string {
    if (this.isSurprise && this.roll !== null) return this.isBad ? '#ff5e78' : '#ffe080';
    if (this.isPuzzleResult) return this.puzzleCorrect ? '#6dffa0' : '#ff5e78';
    if (this.isTheft && this.theftKind) return this.theftBlocked ? '#8fb4ff' : this.theftKind === 'COIN' ? '#ffd84a' : '#4fd17a';
    return SKILL_GLOW[this.type];
  }
}
