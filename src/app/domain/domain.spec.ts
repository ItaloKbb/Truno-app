import { describe, expect, it } from 'vitest';
import { mockCards } from '../models/mock/card.mock';
import { mockGame } from '../models/mock/game.mock';
import { RANKS, SUITS } from './card';
import { compareTrucoCards, createCard, createSpanishDeck } from './deck';
import { TRUCO_POINTS } from './stake';

describe('Truno Crazy domain', () => {
  it('builds the Spanish deck of 40 unique cards', () => {
    const deck = createSpanishDeck();
    const ids = new Set(deck.map((card) => card.id));

    expect(deck).toHaveLength(SUITS.length * RANKS.length);
    expect(ids.size).toBe(40);
    expect(deck.every((card) => card.effect === null)).toBe(true);
    expect(deck[0]).toMatchObject({
      id: 'card-espadas-01',
      naipe: 'ESPADAS',
      valor: '1',
      url: '/assets/cards/01-espadas.png',
    });
  });

  it('ranks cards with the Paulista hierarchy', () => {
    const threeOfOuros = createCard('OUROS', '3');
    const twoOfBastos = createCard('BASTOS', '2');
    const threeOfBastos = createCard('BASTOS', '3');
    const threeOfCopas = createCard('COPAS', '3');
    const ace = createCard('ESPADAS', '1');
    const king = createCard('ESPADAS', '12');

    expect(compareTrucoCards(threeOfOuros, twoOfBastos)).toBeGreaterThan(0);
    expect(compareTrucoCards(threeOfBastos, threeOfCopas)).toBeGreaterThan(0);
    expect(compareTrucoCards(ace, king)).toBeGreaterThan(0);
    expect(compareTrucoCards(king, ace)).toBeLessThan(0);
  });

  it('exposes the same catalog cards the book already renders', () => {
    expect(mockCards).toHaveLength(40);
    for (const card of mockCards) {
      expect(card.id).toMatch(/^card-(espadas|bastos|oros|copas)-\d{2}$/);
      expect(card.url).toBe(card.imageUrl);
      expect(card.naipe).toBe(card.suit);
    }
  });

  it('describes an in-progress Truno match', () => {
    expect(mockGame.status).toBe('EM_ANDAMENTO');
    expect(mockGame.handSize).toBe(3);
    expect(mockGame.pointsToWin).toBe(12);
    expect(mockGame.rounds[0]?.stakes[0]?.pointsIfAccepted).toBe(TRUCO_POINTS.TRUCO);
    expect(mockGame.players.map((player) => player.user.name)).toEqual(['Ana', 'Bruno']);
  });
});
