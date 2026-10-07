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
  host: { 'aria-hidden': 'true', '[style.--glow]': 'glow' },
})
export class SkillBurst {
  @Input({ required: true }) type!: SkillType;

  get icon(): string {
    return SKILL_ICON[this.type];
  }

  get glow(): string {
    return SKILL_GLOW[this.type];
  }
}
