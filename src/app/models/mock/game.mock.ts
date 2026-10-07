import { createCard, withEffect } from '../../domain/deck';
import type Game from '../game';
import type { User } from '../user';

const playerOne: User = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@example.com',
  url: 'https://i.pravatar.cc/150?img=47',
  coin: {
    id: 'coin-1',
    balance: 250,
  },
};

const playerTwo: User = {
  id: 'user-2',
  name: 'Bruno',
  email: 'bruno@example.com',
  url: 'https://i.pravatar.cc/150?img=12',
  coin: {
    id: 'coin-2',
    balance: 180,
  },
};

const anaCopas = withEffect(createCard('COPAS', '1'), { kind: 'SHIELD' });
const anaEspadas = createCard('ESPADAS', '7');
const brunoOuros = withEffect(createCard('OUROS', '12'), { kind: 'BLOCK' });
const brunoBastos = createCard('BASTOS', '5');

export const mockGame: Game = {
  id: 'game-1',
  name: 'Partida entre amigos',
  players: [
    {
      user: playerOne,
      cards: [anaCopas, anaEspadas],
      effect: null,
      trophies: 2,
      points: 0,
      calledUno: false,
    },
    {
      user: playerTwo,
      cards: [brunoOuros, brunoBastos],
      effect: 'BLOCK',
      trophies: 1,
      points: 1,
      calledUno: false,
    },
  ],
  rounds: [
    {
      id: 'round-1',
      number: 1,
      tricks: [
        {
          id: 'trick-1',
          number: 1,
          plays: [
            {
              id: 'play-1',
              playerId: playerOne.id,
              cardId: anaCopas.id,
              skillId: null,
              targetPlayerId: null,
            },
            {
              id: 'play-2',
              playerId: playerTwo.id,
              cardId: brunoOuros.id,
              skillId: 'skill-1',
              targetPlayerId: playerOne.id,
            },
          ],
          winnerId: null,
        },
      ],
      stakes: [
        {
          id: 'stake-1',
          kind: 'TRUCO',
          call: 'TRUCO',
          callerId: playerTwo.id,
          response: null,
          pointsIfAccepted: 3,
        },
      ],
      winnerId: null,
      status: 'EM_ANDAMENTO',
    },
  ],
  status: 'EM_ANDAMENTO',
  winner: null,
  pointsToWin: 12,
  direction: 'HORARIO',
  currentSuit: 'COPAS',
  handSize: 3,
};
