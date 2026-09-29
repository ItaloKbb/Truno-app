import type { StakeChallenge } from './stake';

export const ROUND_STATUSES = ['EM_ANDAMENTO', 'FINALIZADO'] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

/** Uma jogada dentro da vaza. */
export interface Play {
  id: string;
  playerId: string;
  cardId: string;
  skillId: string | null;
  targetPlayerId: string | null;
}

/** Vaza: cada jogador baixa uma carta. A mão tem até três. */
export interface Trick {
  id: string;
  number: 1 | 2 | 3;
  plays: Play[];
  winnerId: string | null;
}

/** Mão do Truco: até três vazas e os pedidos de truco ou envido. */
export interface Round {
  id: string;
  number: number;
  tricks: Trick[];
  stakes: StakeChallenge[];
  winnerId: string | null;
  status: RoundStatus;
}
