import type { CardEffectKind, Suit } from './card';

export const SKILL_CATEGORIES = ['DEFESA', 'ATAQUE', 'SUPORTE', 'CONTROLE'] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/** Habilidade que uma carta pode disparar ao ser jogada. */
export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillCategory;
  effect: CardEffectKind;
  naipe: Suit;
  valor: string;
}
