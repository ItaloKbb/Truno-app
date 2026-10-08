import { Router } from 'express';
import type { CreateLobbyRoom, LobbyRoom } from '../app/domain/lobby';
import { LOBBY_VISIBILITIES } from '../app/domain/lobby';
import { POINTS_TO_WIN } from '../app/domain/game';
import type {
  Achievement,
  CollectionCard,
  MatchActivity,
  PlayerStats,
  Profile,
} from '../app/domain/profile';
import { mockCards } from '../app/models/mock/card.mock';
import { mockGame } from '../app/models/mock/game.mock';
import { mockPuzzles } from '../app/models/mock/puzzle.mock';
import { mockShop } from '../app/models/mock/shop.mock';
import { mockSkills } from '../app/models/mock/skill.mock';

const profile: Profile = {
  id: 'user-demo',
  displayName: 'Jogador de demonstração',
  username: 'jogador-demo',
  avatarUrl: '',
  level: 18,
  experience: 1250,
  experienceToNextLevel: 1500,
  coins: 15750,
  gems: 2500,
  favoriteCardId: 'card-espadas-01',
};

const stats: PlayerStats = {
  matchesPlayed: 200,
  wins: 125,
  winRate: 0.625,
  currentWinStreak: 3,
  coins: 15750,
  gems: 2500,
};

const collection: CollectionCard[] = [
  { name: 'Guardião da Floresta', rarity: 'Rara', level: 3, obtained: true },
  { name: 'Feiticeira Lunar', rarity: 'Épica', level: 4, obtained: true },
  { name: 'Dragão Rubro', rarity: 'Lendária', level: 5, obtained: true },
  { name: 'Sentinela de Gelo', rarity: 'Rara', level: 6, obtained: true },
  { name: 'Caçador Solar', rarity: 'Desconhecida', level: 0, obtained: false },
  { name: 'Oráculo das Marés', rarity: 'Desconhecida', level: 0, obtained: false },
];

const achievements: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Primeira lendária',
    description: 'Obtenha uma carta lendária.',
    progress: 1,
    goal: 1,
    reward: '150 moedas',
    unlockedAt: '2026-09-01',
  },
  {
    id: 'ach-2',
    title: 'Mestre estrategista',
    description: 'Vença uma partida valendo truco.',
    progress: 1,
    goal: 1,
    reward: '200 moedas',
    unlockedAt: '2026-09-10',
  },
  {
    id: 'ach-3',
    title: 'Colecionador',
    description: 'Reúna 100 cartas.',
    progress: 24,
    goal: 100,
    reward: 'Pacote de cartas',
  },
];

const activities: MatchActivity[] = [
  {
    id: 'activity-1',
    result: 'VITORIA',
    opponentName: 'ana',
    playedAt: '2026-09-28T18:00:00.000Z',
  },
  {
    id: 'activity-2',
    result: 'DERROTA',
    opponentName: 'pedro',
    playedAt: '2026-09-27T21:00:00.000Z',
  },
];

export interface CatalogApi {
  cards(): typeof mockCards;
  card(id: string): (typeof mockCards)[number] | undefined;
  games(): (typeof mockGame)[];
  game(id: string): typeof mockGame | undefined;
  shop(): typeof mockShop;
  skills(): typeof mockSkills;
  skill(id: string): (typeof mockSkills)[number] | undefined;
  puzzles(): typeof mockPuzzles;
  puzzle(id: string): (typeof mockPuzzles)[number] | undefined;
  rooms(): LobbyRoom[];
  room(id: string): LobbyRoom | undefined;
  createRoom(input: unknown): { status: number; body: LobbyRoom | { message: string } };
  profile(): Profile;
  stats(): PlayerStats;
  collection(): CollectionCard[];
  achievements(): Achievement[];
  activities(): MatchActivity[];
}

export function createCatalogApi(): CatalogApi {
  const rooms: LobbyRoom[] = [
    {
      id: 'room-1',
      name: 'Mesa rápida',
      hostId: 'user-demo',
      visibility: 'PUBLICA',
      maxPlayers: 2,
      playerIds: ['user-demo'],
      pointsToWin: 12,
      status: 'ABERTA',
    },
    {
      id: 'room-2',
      name: 'Desafio valendo quatro',
      hostId: 'user-2',
      visibility: 'PRIVADA',
      maxPlayers: 4,
      playerIds: ['user-2', 'user-1'],
      pointsToWin: 30,
      status: 'EM_JOGO',
    },
  ];

  return {
    cards: () => mockCards,
    card: (id) => mockCards.find((card) => card.id === id),
    games: () => [mockGame],
    game: (id) => (mockGame.id === id ? mockGame : undefined),
    shop: () => mockShop,
    skills: () => mockSkills,
    skill: (id) => mockSkills.find((skill) => skill.id === id),
    puzzles: () => mockPuzzles,
    puzzle: (id) => mockPuzzles.find((puzzle) => puzzle.id === id),
    rooms: () => rooms.map((room) => ({ ...room, playerIds: [...room.playerIds] })),
    room: (id) => rooms.find((room) => room.id === id),
    createRoom(input: unknown) {
      const room = readRoom(input);
      if (!room)
        return {
          status: 400,
          body: { message: 'Informe nome, anfitrião, visibilidade e pontuação.' },
        };
      rooms.push(room);
      return { status: 201, body: room };
    },
    profile: () => profile,
    stats: () => stats,
    collection: () => collection,
    achievements: () => achievements,
    activities: () => activities,
  };
}

export function catalogRouter(api: CatalogApi): Router {
  const router = Router();

  router.get('/cards', (_request, response) => response.json(api.cards()));
  router.get('/cards/:id', (request, response) =>
    sendOne(response, api.card(routeId(request.params['id'])), 'Carta não encontrada.'),
  );
  router.get('/games', (_request, response) => response.json(api.games()));
  router.get('/games/:id', (request, response) =>
    sendOne(response, api.game(routeId(request.params['id'])), 'Partida não encontrada.'),
  );
  router.get('/shop', (_request, response) => response.json(api.shop()));
  router.get('/skills', (_request, response) => response.json(api.skills()));
  router.get('/skills/:id', (request, response) =>
    sendOne(response, api.skill(routeId(request.params['id'])), 'Habilidade não encontrada.'),
  );
  router.get('/puzzles', (_request, response) => response.json(api.puzzles()));
  router.get('/puzzles/:id', (request, response) =>
    sendOne(response, api.puzzle(routeId(request.params['id'])), 'Pergunta não encontrada.'),
  );
  router.get('/lobby/rooms', (_request, response) => response.json(api.rooms()));
  router.get('/lobby/rooms/:id', (request, response) =>
    sendOne(response, api.room(routeId(request.params['id'])), 'Mesa não encontrada.'),
  );
  router.post('/lobby/rooms', (request, response) => {
    const result = api.createRoom(request.body);
    response.status(result.status).json(result.body);
  });
  router.get('/profile/stats', (_request, response) => response.json(api.stats()));
  router.get('/profile/collection', (_request, response) => response.json(api.collection()));
  router.get('/profile/achievements', (_request, response) => response.json(api.achievements()));
  router.get('/profile/activities', (_request, response) => response.json(api.activities()));
  router.get('/profile', (_request, response) => response.json(api.profile()));

  return router;
}

function sendOne(
  response: { status(code: number): { json(body: unknown): void }; json(body: unknown): void },
  value: unknown,
  message: string,
): void {
  if (value === undefined) {
    response.status(404).json({ message });
    return;
  }
  response.json(value);
}

function routeId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function readRoom(input: unknown): LobbyRoom | null {
  if (!input || typeof input !== 'object') return null;
  const body = input as Partial<CreateLobbyRoom>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const hostId = typeof body.hostId === 'string' ? body.hostId.trim() : '';
  const visibility = LOBBY_VISIBILITIES.find((item) => item === body.visibility);
  const pointsToWin = POINTS_TO_WIN.find((points) => points === body.pointsToWin);
  if (name.length < 3 || name.length > 40 || !hostId || !visibility || !pointsToWin) return null;
  if (body.maxPlayers !== 2 && body.maxPlayers !== 4) return null;

  return {
    id: `room-${crypto.randomUUID()}`,
    name,
    hostId,
    visibility,
    maxPlayers: body.maxPlayers,
    playerIds: [hostId],
    pointsToWin,
    status: 'ABERTA',
  };
}
