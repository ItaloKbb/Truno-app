import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { mockCards } from '../models/mock/card.mock';
import { mockGame } from '../models/mock/game.mock';
import { mockPuzzle } from '../models/mock/puzzle.mock';
import { mockShop } from '../models/mock/shop.mock';
import { mockSkill } from '../models/mock/skill.mock';
import { CardService } from './card.service';
import { GameService } from './game.service';
import { LobbyService } from './lobby.service';
import { ProfileService } from './profile.service';
import { PuzzleService } from './puzzle.service';
import { ShopService } from './shop.service';
import { SkillService } from './skill.service';

describe('domain services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the card catalog and a single card', () => {
    const service = TestBed.inject(CardService);
    const received: unknown[] = [];
    service.getAll().subscribe((cards) => received.push(cards));
    service.getById('card-espadas-01').subscribe((card) => received.push(card));

    http.expectOne('/api/cards').flush(mockCards);
    http.expectOne('/api/cards/card-espadas-01').flush(mockCards[0]);

    expect(received[0]).toHaveLength(40);
    expect(received[1]).toMatchObject({ id: 'card-espadas-01', naipe: 'ESPADAS' });
  });

  it('turns an HTTP failure into a visible error instead of an empty catalog', () => {
    const service = TestBed.inject(CardService);
    const errors: Error[] = [];
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    service.getAll().subscribe({ error: (error: Error) => errors.push(error) });
    http.expectOne('/api/cards').flush(null, { status: 500, statusText: 'Server Error' });

    expect(errors.map((error) => error.message)).toEqual(['Falha ao carregar as cartas.']);
  });

  it('loads the match, the shop, skills and puzzles from their endpoints', () => {
    const games = TestBed.inject(GameService);
    const shop = TestBed.inject(ShopService);
    const skills = TestBed.inject(SkillService);
    const puzzles = TestBed.inject(PuzzleService);
    const names: string[] = [];

    games.getById('game-1').subscribe((game) => names.push(game.name));
    shop.get().subscribe((current) => names.push(current.name));
    skills.getAll().subscribe((items) => names.push(items[0]?.name ?? ''));
    puzzles.getById('puzzle-1').subscribe((puzzle) => names.push(puzzle.title));

    http.expectOne('/api/games/game-1').flush(mockGame);
    http.expectOne('/api/shop').flush(mockShop);
    http.expectOne('/api/skills').flush([mockSkill]);
    http.expectOne('/api/puzzles/puzzle-1').flush(mockPuzzle);

    expect(names).toEqual(['Partida entre amigos', 'Truno Shop', 'Block', mockPuzzle.title]);
  });

  it('creates a lobby room and reads the profile sections', () => {
    const lobby = TestBed.inject(LobbyService);
    const profile = TestBed.inject(ProfileService);
    const created: string[] = [];
    const username: string[] = [];

    lobby
      .create({
        name: 'Mesa do Lucas',
        hostId: 'user-lucas',
        visibility: 'PUBLICA',
        maxPlayers: 2,
        pointsToWin: 12,
      })
      .subscribe((room) => created.push(room.id));
    profile.getProfile().subscribe((current) => username.push(current.username));
    profile.getCollection().subscribe((cards) => username.push(String(cards.length)));

    const create = http.expectOne('/api/lobby/rooms');
    expect(create.request.method).toBe('POST');
    create.flush({
      id: 'room-9',
      name: 'Mesa do Lucas',
      hostId: 'user-lucas',
      visibility: 'PUBLICA',
      maxPlayers: 2,
      playerIds: ['user-lucas'],
      pointsToWin: 12,
      status: 'ABERTA',
    });
    http.expectOne('/api/profile').flush({
      id: 'user-lucas',
      displayName: 'Lucas Martins',
      username: 'lucasmartins',
      level: 18,
      experience: 1250,
      experienceToNextLevel: 1500,
      coins: 15750,
      gems: 2500,
    });
    http
      .expectOne('/api/profile/collection')
      .flush([{ name: 'Dragão Rubro', rarity: 'Lendária', level: 5, obtained: true }]);

    expect(created).toEqual(['room-9']);
    expect(username).toEqual(['lucasmartins', '1']);
  });
});
