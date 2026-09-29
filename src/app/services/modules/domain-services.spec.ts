import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { mockShop } from '../../models/mock/shop.mock';
import type { GameState } from '../../domain/truno-api';
import { API_BASE_URL } from '../config/api-config';
import { ApiError } from '../config/api-response';
import { CardService } from './card.service';
import { GameService } from './game.service';
import { ProfileService } from './profile.service';
import { PuzzleService } from './puzzle.service';
import { RankingService } from './ranking.service';
import { ShopService } from './shop.service';
import { SkillService } from './skill.service';

const gameState: GameState = {
  id: 5,
  code: 'ABC123',
  name: 'Mesa do Lucas',
  phase: 'AGUARDANDO_JOGADORES',
  stateVersion: 1,
  settings: { maxPlayers: 4, initialCards: 3, roundReward: 10, emptyHandReward: 5, trophyPrice: 20 },
  direction: 'HORARIO',
  roundNumber: 0,
  roundStatus: null,
  vira: null,
  currentPlayerId: null,
  players: [],
  plays: [],
  hand: [],
  pendingPuzzle: null,
  winnerPlayerId: null,
};

describe('domain services', () => {
  let http: HttpTestingController;
  let api: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(API_BASE_URL);
  });

  afterEach(() => http.verify());

  it('loads the card catalog and a single card from the API', () => {
    const service = TestBed.inject(CardService);
    const received: unknown[] = [];
    service.getAll().subscribe((cards) => received.push(cards));
    service.getById(3).subscribe((card) => received.push(card));

    http.expectOne(`${api}/cards`).flush([{ id: 1, valor: 'AS', naipe: 'ESPADAS' }]);
    http.expectOne(`${api}/cards/3`).flush({ id: 3, valor: 'REI', naipe: 'PAUS' });

    expect(received[0]).toHaveLength(1);
    expect(received[1]).toMatchObject({ id: 3, naipe: 'PAUS' });
  });

  it('keeps the API message and status when a request fails', () => {
    const service = TestBed.inject(CardService);
    const errors: ApiError[] = [];
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    service.getById(99).subscribe({ error: (error: ApiError) => errors.push(error) });
    http
      .expectOne(`${api}/cards/99`)
      .flush({ message: 'Carta não encontrada' }, { status: 404, statusText: 'Not Found' });

    expect(errors[0]?.message).toBe('Carta não encontrada');
    expect(errors[0]?.status).toBe(404);
  });

  it('turns an HTTP failure without body into a visible error instead of an empty catalog', () => {
    const service = TestBed.inject(CardService);
    const errors: Error[] = [];
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    service.getAll().subscribe({ error: (error: Error) => errors.push(error) });
    http.expectOne(`${api}/cards`).flush(null, { status: 500, statusText: 'Server Error' });

    expect(errors.map((error) => error.message)).toEqual(['Falha ao carregar as cartas.']);
  });

  it('loads skills, puzzles and the ranking', () => {
    const names: string[] = [];
    TestBed.inject(SkillService)
      .getAll()
      .subscribe((items) => names.push(items[0]?.name ?? ''));
    TestBed.inject(PuzzleService)
      .getById(2)
      .subscribe((puzzle) => names.push(puzzle.question));
    TestBed.inject(RankingService)
      .getAll()
      .subscribe((entries) => names.push(entries[0]?.nickname ?? ''));

    http.expectOne(`${api}/skills`).flush([
      { id: 1, name: 'Block', description: 'Bloqueia', type: 'BLOCK', naipe: 'COPAS', valor: 'AS' },
    ]);
    http.expectOne(`${api}/puzzles/2`).flush({ id: 2, question: 'Quanto é 2+2?', alternativas: ['3', '4'] });
    http.expectOne(`${api}/users/ranking`).flush([{ id: 1, nickname: 'lucas', rankingPoints: 30 }]);

    expect(names).toEqual(['Block', 'Quanto é 2+2?', 'lucas']);
  });

  it('runs every match action against its endpoint and returns the new state', () => {
    const games = TestBed.inject(GameService);
    const calls: Array<[string, () => unknown, string, unknown]> = [
      ['POST', () => games.create({ name: ' Mesa ', maxPlayers: 4, initialCards: 3, roundReward: 10, emptyHandReward: 5, trophyPrice: 20 }), '/games', { name: 'Mesa', maxPlayers: 4, initialCards: 3, roundReward: 10, emptyHandReward: 5, trophyPrice: 20 }],
      ['POST', () => games.access(' abc123 '), '/games/access', { code: 'ABC123' }],
      ['POST', () => games.start(5), '/games/5/start', null],
      ['GET', () => games.getState(5), '/games/5/state', null],
      ['POST', () => games.playCard(5, 11), '/games/5/plays', { handCardId: 11 }],
      ['POST', () => games.answerPuzzle(5, 2, 1), '/games/5/puzzle-answers', { challengeId: 2, alternativeIndex: 1 }],
      ['POST', () => games.buyTrophy(5), '/games/5/trophies', null],
      ['POST', () => games.readyForNextRound(5), '/games/5/ready', null],
      ['POST', () => games.cancel(5), '/games/5/cancel', null],
    ];
    const versions: number[] = [];

    for (const [method, call, path, body] of calls) {
      (call() as { subscribe: (next: (s: GameState) => void) => void }).subscribe((state) =>
        versions.push(state.stateVersion),
      );
      const request = http.expectOne(`${api}${path}`);
      expect(request.request.method).toBe(method);
      expect(request.request.body).toEqual(body);
      request.flush(gameState);
    }

    expect(versions).toHaveLength(calls.length);
  });

  it('rejects a match state that the guard does not recognise', () => {
    const errors: Error[] = [];
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.inject(GameService)
      .getState(5)
      .subscribe({ error: (error: Error) => errors.push(error) });
    http.expectOne(`${api}/games/5/state`).flush({ id: 5, phase: 'INVENTADA' });

    expect(errors.map((error) => error.message)).toEqual(['Falha ao carregar a partida.']);
  });

  it('flags a 409 conflict so the screen can re-read the state', () => {
    const errors: ApiError[] = [];
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.inject(GameService)
      .playCard(5, 11)
      .subscribe({ error: (error: ApiError) => errors.push(error) });
    http
      .expectOne(`${api}/games/5/plays`)
      .flush({ message: 'Não é a sua vez.' }, { status: 409, statusText: 'Conflict' });

    expect(errors[0]?.isConflict).toBe(true);
    expect(errors[0]?.message).toBe('Não é a sua vez.');
  });

  it('keeps reading the shop and the profile from the local server', () => {
    const shop = TestBed.inject(ShopService);
    const profile = TestBed.inject(ProfileService);
    const received: string[] = [];

    shop.get().subscribe((current) => received.push(current.name));
    profile.getProfile().subscribe((current) => received.push(current.username));

    http.expectOne('/api/shop').flush(mockShop);
    http.expectOne('/api/profile').flush({
      id: 'user-lucas',
      displayName: 'Lucas Martins',
      username: '
