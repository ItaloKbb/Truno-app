import {
  cardId,
  cardImageUrl,
  RANK_LABEL,
  RANKS,
  SUITS,
  type Card,
  type CardEffect,
  type Rank,
  type Suit,
} from './card';

/**
 * Hierarquia fixa do Truco Paulista, do mais forte para o mais fraco:
 * 3, 2, ás, rei, cavalo, sota, 7, 6, 5, 4.
 */
const RANK_WEIGHT: Record<Rank, number> = {
  '3': 10,
  '2': 9,
  '1': 8,
  '12': 7,
  '11': 6,
  '10': 5,
  '7': 4,
  '6': 3,
  '5': 2,
  '4': 1,
};

/** Desempate de naipe: bastos (paus), copas, espadas, ouros. */
const SUIT_WEIGHT: Record<Suit, number> = {
  BASTOS: 4,
  COPAS: 3,
  ESPADAS: 2,
  OUROS: 1,
};

export function trucoStrength(suit: Suit, rank: Rank): number {
  return RANK_WEIGHT[rank] * 10 + SUIT_WEIGHT[suit];
}

/** Positivo quando `left` vence `right` na vaza. */
export function compareTrucoCards(left: Card, right: Card): number {
  return left.trucoStrength - right.trucoStrength;
}

export function createCard(suit: Suit, rank: Rank, effect: CardEffect | null = null): Card {
  const imageUrl = cardImageUrl(suit, rank);

  return {
    id: cardId(suit, rank),
    suit,
    rank,
    naipe: suit,
    valor: RANK_LABEL[rank],
    url: imageUrl,
    imageUrl,
    trucoStrength: trucoStrength(suit, rank),
    effect,
  };
}

/** Baralho espanhol completo: 4 naipes e 10 valores, sem curingas. */
export function createSpanishDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => createCard(suit, rank)));
}

export function withEffect(card: Card, effect: CardEffect | null): Card {
  return { ...card, effect };
}
