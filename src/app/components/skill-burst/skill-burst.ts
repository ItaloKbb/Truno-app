import { Component, Input } from '@angular/core';
import { SKILL_ICON, type SkillType } from '../../domain/truno-api';

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

/** Emoji da habilidade atravessando a tela em giro 3D; não captura cliques. */
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
    '[class.is-bad]': 'isBad',
  },
})
export class SkillBurst {
  @Input({ required: true }) type!: SkillType;
  @Input() roll: number | null = null;
  @Input() coinDelta: number | null = null;

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

  get isBad(): boolean {
    return this.isSurprise && this.roll !== null && this.roll < 0;
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

  get icon(): string {
    return SKILL_ICON[this.type];
  }

  get glow(): string {
    if (this.isSurprise && this.roll !== null) return this.isBad ? '#ff5e78' : '#ffe080';
    return SKILL_GLOW[this.type];
  }
}
