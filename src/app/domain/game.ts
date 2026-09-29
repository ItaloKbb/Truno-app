import type { Card, CardEffectKind, Suit } from './card';
import type { Round } from './round';
import type { User } from './user';

export const GAME_STATUSES = ['PENDENTE', 'EM_ANDAMENTO', 'FINALIZADO'] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const PLAY_DIRECTIONS = ['HORARIO', 'ANTI_HORARIO'] as const;
export type PlayDirection = (typeof PLAY_DIRECTIONS)[number];

export const POINTS_TO_WIN = [12, 15, 30] as const;
export type PointsToWin = (typeof POINTS_TO_WIN)[number];

/** Lugar de um jogador na mesa. */
export interface PlayerSeat {
  user: User;
  cards: Card[];
  /** Efeito de UNO ainda ativo sobre este jogador. */
  effect: CardEffectKind | null;
  trophies: number;
  /** Pontos de Truco acumulados na partida. */
  points: number;
  /** Verdadeiro quando o jogador declarou a última carta, como no UNO. */
  calledUno: boolean;
}

/**
 * Partida de Truno Crazy.
 * Cada mão segue o Truco (três cartas, vazas e truco) e as cartas podem
 * carregar efeitos de UNO.
 */
export interface Game {
  id: string;
  name: string;
  players: PlayerSeat[];
  rounds: Round[];
  status: GameStatus;
  winner: User | null;
  pointsToWin: PointsToWin;
  direction: PlayDirection;
  /** Naipe que a próxima carta deve seguir. Nulo quando a saída é livre. */
  currentSuit: Suit | null;
  handSize: 3;
}

export interface TrunoRules {
  handSize: 3;
  tricksPerRound: 3;
  effectsEnabled: boolean;
  unoCallEnabled: boolean;
  pointsToWin: PointsToWin;
  deck: 'SPANISH_40';
}

export const DEFAULT_TRUNO_RULES: TrunoRules = {
  handSize: 3,
  tricksPerRound: 3,
  effectsEnabled: true,
  unoCallEnabled: true,
  pointsToWin: 12,
  deck: 'SPANISH_40',
};
