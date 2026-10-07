/**
 * Contrato da API Truno Crazzy (java-web). Os nomes em maiúsculas são os
 * mesmos textos que o backend envia; o domínio não calcula regra de jogo.
 * A API é a fonte de verdade para vencedor, manilha, moedas e turnos.
 */
export const GAME_PHASES = [
  'AGUARDANDO_JOGADORES',
  'EM_ANDAMENTO',
  'ENTRE_RODADAS',
  'FINALIZADO',
  'CANCELADO',
] as const;
export type GamePhase = (typeof GAME_PHASES)[number];

export const MATCH_ROUND_STATUSES = ['EM_ANDAMENTO', 'AGUARDANDO_PUZZLE', 'FINALIZADO'] as const;
export type MatchRoundStatus = (typeof MATCH_ROUND_STATUSES)[number];

export const GAME_DIRECTIONS = ['HORARIO', 'ANTI_HORARIO'] as const;
export type GameDirection = (typeof GAME_DIRECTIONS)[number];

export const CARD_VALUES = [
  'AS',
  'DOIS',
  'TRES',
  'QUATRO',
  'CINCO',
  'SEIS',
  'SETE',
  'DAMA',
  'VALETE',
  'REI',
] as const;
export type CardValue = (typeof CARD_VALUES)[number];

export const CARD_SUITS = ['OUROS', 'ESPADAS', 'COPAS', 'PAUS'] as const;
export type CardSuit = (typeof CARD_SUITS)[number];

export const SURPRISE_POWER: Record<CardSuit, 1 | 2 | 3 | 4> = {
  OUROS: 1,
  ESPADAS: 2,
  COPAS: 3,
  PAUS: 4,
};

export const BUY_POWER: Record<CardSuit, 2 | 3 | 4> = {
  OUROS: 2,
  ESPADAS: 2,
  COPAS: 3,
  PAUS: 4,
};

/** Acerto ganha e erro compra essa quantidade. */
export const PUZZLE_POWER: Record<CardSuit, 1 | 2 | 3 | 4> = {
  OUROS: 1,
  ESPADAS: 2,
  COPAS: 3,
  PAUS: 4,
};

export const SKILL_TYPES = [
  'BLOCK',
  'THEFT',
  'INVERTS',
  'BUY',
  'BURN',
  'SURPRISE',
  'PUZZLE',
  'CHANGEOFHANDS',
  'BOMB',
  'SHIELD',
] as const;
export type SkillType = (typeof SKILL_TYPES)[number];

export const SKILL_ICON: Record<SkillType, string> = {
  BLOCK: '⛔',
  THEFT: '🫳',
  INVERTS: '🔄',
  BUY: '➕',
  BURN: '🔥',
  SURPRISE: '🎁',
  PUZZLE: '❓',
  CHANGEOFHANDS: '🤝',
  BOMB: '💣',
  SHIELD: '🛡️',
};

/** Rótulo de reserva quando o catálogo de `GET /skills` não carregou. */
export const SKILL_LABEL: Record<SkillType, string> = {
  BLOCK: 'Bloqueio',
  THEFT: 'Roubo',
  INVERTS: 'Inverter',
  BUY: 'Compra',
  BURN: 'Queimar',
  SURPRISE: 'Surpresa',
  PUZZLE: 'Pergunta',
  CHANGEOFHANDS: 'Troca de mãos',
  BOMB: 'Bomba',
  SHIELD: 'Escudo',
};

/** Ordem de força para exibição da sequência: 4, 5, 6, 7, Q, J, K, A, 2, 3. */
export const CARD_GAME_ORDER: readonly CardValue[] = [
  'QUATRO',
  'CINCO',
  'SEIS',
  'SETE',
  'DAMA',
  'VALETE',
  'REI',
  'AS',
  'DOIS',
  'TRES',
];

const VALUE_LABEL: Record<CardValue, string> = {
  AS: 'Ás',
  DOIS: '2',
  TRES: '3',
  QUATRO: '4',
  CINCO: '5',
  SEIS: '6',
  SETE: '7',
  DAMA: 'Dama',
  VALETE: 'Valete',
  REI: 'Rei',
};

const SUIT_LABEL: Record<CardSuit, string> = {
  OUROS: 'Ouros',
  ESPADAS: 'Espadas',
  COPAS: 'Copas',
  PAUS: 'Paus',
};

/** Arquivos em `public/assets/cards`: baralho espanhol (sota, cavalo, rei). */
const VALUE_ASSET: Record<CardValue, string> = {
  AS: '01',
  DOIS: '02',
  TRES: '03',
  QUATRO: '04',
  CINCO: '05',
  SEIS: '06',
  SETE: '07',
  VALETE: '10',
  DAMA: '11',
  REI: '12',
};

const SUIT_ASSET: Record<CardSuit, string> = {
  OUROS: 'oros',
  ESPADAS: 'espadas',
  COPAS: 'copas',
  PAUS: 'bastos',
};

export function cardLabel(valor: CardValue, naipe: CardSuit): string {
  return `${VALUE_LABEL[valor]} de ${SUIT_LABEL[naipe]}`;
}

export function cardAsset(valor: CardValue, naipe: CardSuit): string {
  return `assets/cards/${VALUE_ASSET[valor]}-${SUIT_ASSET[naipe]}.png`;
}

/** `POST /auth/sessions` */
export interface PlayerUser {
  id: number;
  nickname: string;
  rankingPoints: number;
}

/** `POST /games` */
export interface CreateGameInput {
  name: string;
  maxPlayers: number;
  initialCards: number;
  roundReward: number;
  emptyHandReward: number;
  trophyPrice: number;
}

export interface GameSettings {
  maxPlayers: number;
  initialCards: number;
  roundReward: number;
  emptyHandReward: number;
  trophyPrice: number;
}

/** `id` é o do jogador dentro da partida (não o `PlayerUser.id`). */
export interface GamePlayer {
  id: number;
  nickname: string;
  position: number;
  matchCoins: number;
  trophies: number;
  handSize: number;
  ready: boolean;
  host: boolean;
}

/** Só `handCardId` pode ser enviado para jogar uma carta. */
export interface GameCard {
  handCardId: number | null;
  catalogCardId: number;
  valor: CardValue;
  naipe: CardSuit;
  skill: SkillType | null;
}

export interface GamePlay {
  playerId: number;
  nickname: string;
  card: GameCard;
  order: number;
  /** Sorteio nominal da Surpresa: sinal define boa/ruim; módulo segue o naipe. */
  surpriseRoll?: number | null;
  /** Moedas efetivamente ganhas/perdidas, limitado a zero no resultado ruim. */
  surpriseCoinDelta?: number | null;
  /** Cartas efetivamente compradas por Buy; zero quando bloqueada ou sem cartas disponíveis. */
  buyCardsDrawn?: number | null;
  /** Nulo enquanto o puzzle aguarda resposta. */
  puzzleCorrect?: boolean | null;
  /** Moedas ganhas no acerto ou cartas efetivamente compradas no erro. */
  puzzleAmount?: number | null;
}

export interface PendingPuzzle {
  challengeId: number;
  question: string;
  alternatives: string[];
}

/** Rodada encerrada; `playerId`/`nickname` nulos quando houve empate. */
export interface RoundWinner {
  roundNumber: number;
  playerId: number | null;
  nickname: string | null;
}

export interface GameState {
  id: number;
  code: string;
  name: string;
  phase: GamePhase;
  stateVersion: number;
  settings: GameSettings;
  direction: GameDirection;
  roundNumber: number;
  roundStatus: MatchRoundStatus | null;
  vira: GameCard | null;
  currentPlayerId: number | null;
  players: GamePlayer[];
  plays: GamePlay[];
  hand: GameCard[];
  pendingPuzzle: PendingPuzzle | null;
  winnerPlayerId: number | null;
  /** Opcional: versões antigas da API não enviam o histórico de rodadas. */
  roundWinners?: RoundWinner[];
}

/** `GET /cards` */
export interface CatalogCard {
  id: number;
  valor: CardValue;
  naipe: CardSuit;
}

/** `GET /skills` */
export interface SkillDefinition {
  id: number;
  name: string;
  description: string;
  type: SkillType;
  naipe: CardSuit;
  valor: CardValue;
}

/** `GET /puzzles`: nunca traz a resposta correta. */
export interface PuzzleDefinition {
  id: number;
  question: string;
  alternativas: string[];
}

/** `GET /users/ranking` */
export interface RankingEntry {
  id: number;
  nickname: string;
  rankingPoints: number;
}
