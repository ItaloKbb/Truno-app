/**
 * Baralho espanhol de 40 cartas usado pelo Truco, com efeitos no estilo UNO
 * que podem ser carimbados numa carta durante a partida.
 */
export const SUITS = ['ESPADAS', 'BASTOS', 'OUROS', 'COPAS'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '10', '11', '12'] as const;
export type Rank = (typeof RANKS)[number];

export const SUIT_ASSET: Record<Suit, string> = {
  ESPADAS: 'espadas',
  BASTOS: 'bastos',
  OUROS: 'oros',
  COPAS: 'copas',
};

export const RANK_ASSET: Record<Rank, string> = {
  '1': '01',
  '2': '02',
  '3': '03',
  '4': '04',
  '5': '05',
  '6': '06',
  '7': '07',
  '10': '10',
  '11': '11',
  '12': '12',
};

export const RANK_LABEL: Record<Rank, string> = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '10': '10 (Sota)',
  '11': '11 (Cavalo)',
  '12': '12 (Rei)',
};

/** Efeitos de UNO aplicados sobre as cartas do Truco. */
export const CARD_EFFECTS = [
  'SKIP',
  'REVERSE',
  'DRAW',
  'WILD_SUIT',
  'BLOCK',
  'BOMB',
  'SHIELD',
  'STEAL',
  'SWAP',
  'DOUBLE',
] as const;
export type CardEffectKind = (typeof CARD_EFFECTS)[number];

export interface CardEffect {
  kind: CardEffectKind;
  /** Cartas a comprar ou turnos a pular, quando o efeito usa quantidade. */
  amount?: number;
  /** Naipe escolhido ao jogar um curinga de naipe. */
  chosenSuit?: Suit;
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  /** Nome do naipe já consumido pelo catálogo. */
  naipe: Suit;
  /** Rótulo já consumido pelo catálogo, por exemplo "10 (Sota)". */
  valor: string;
  /** Caminho da imagem já consumido pelo catálogo. */
  url: string;
  imageUrl: string;
  /**
   * Força no Truco Paulista. Valor maior vence a vaza.
   * O naipe só desempata cartas do mesmo valor.
   */
  trucoStrength: number;
  effect: CardEffect | null;
}

export function cardId(suit: Suit, rank: Rank): string {
  return `card-${SUIT_ASSET[suit]}-${RANK_ASSET[rank]}`;
}

export function cardImageUrl(suit: Suit, rank: Rank): string {
  return `/assets/cards/${RANK_ASSET[rank]}-${SUIT_ASSET[suit]}.png`;
}
