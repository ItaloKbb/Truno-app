import { describe, expect, it } from 'vitest';
import { createCatalogApi } from './catalog-api';

describe('catalog API', () => {
  it('serves the Spanish deck, the sample match, the shop, skills and puzzles', () => {
    const api = createCatalogApi();

    expect(api.cards()).toHaveLength(40);
    expect(api.card('card-espadas-01')?.naipe).toBe('ESPADAS');
    expect(api.card('missing')).toBeUndefined();
    expect(api.games().map((game) => game.id)).toEqual(['game-1']);
    expect(api.shop().name).toBe('Truno Shop');
    expect(api.skills().length).toBeGreaterThan(0);
    expect(api.puzzles().every((puzzle) => puzzle.alternativas.length > 0)).toBe(true);
  });

  it('opens a lobby room and keeps the previous ones', () => {
    const api = createCatalogApi();
    const created = api.createRoom({
      name: 'Mesa do Lucas',
      hostId: 'user-lucas',
      visibility: 'PUBLICA',
      maxPlayers: 2,
      pointsToWin: 12,
    });

    expect(created.status).toBe(201);
    expect(api.rooms()).toHaveLength(3);
    expect(api.createRoom({ name: 'x' }).status).toBe(400);
  });

  it('serves the player profile sections', () => {
    const api = createCatalogApi();

    expect(api.profile().username).toBe('lucasmartins');
    expect(api.stats().wins).toBe(125);
    expect(api.collection().some((card) => !card.obtained)).toBe(true);
    expect(api.achievements().map((achievement) => achievement.title)).toContain('Colecionador');
    expect(api.activities().map((activity) => activity.result)).toEqual(['VITORIA', 'DERROTA']);
  });
});
