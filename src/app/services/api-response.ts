import { Observable, catchError, map, throwError } from 'rxjs';
import { CARD_EFFECTS, type Card } from '../domain/card';
import { GAME_STATUSES, POINTS_TO_WIN, type Game } from '../domain/game';
import { LOBBY_STATUSES, LOBBY_VISIBILITIES, type LobbyRoom } from '../domain/lobby';
import {
  COLLECTION_RARITIES,
  type Achievement,
  type CollectionCard,
  type MatchActivity,
  type PlayerStats,
  type Profile,
} from '../domain/profile';
import type { Puzzle } from '../domain/puzzle';
import type { Shop } from '../domain/shop';
import { SKILL_CATEGORIES, type Skill } from '../domain/skill';

export function readApi<T>(
  source: Observable<unknown>,
  parse: (body: unknown) => T,
  message: string,
): Observable<T> {
  return source.pipe(
    map((body) => parse(body)),
    catchError((error: unknown) => {
      console.error(message, error);
      return throwError(() => new Error(message));
    }),
  );
}

export function expectList<T>(value: unknown, guard: (item: unknown) => item is T): T[] {
  if (!Array.isArray(value) || !value.every(guard)) throw new Error('Resposta inválida.');
  return value;
}

export function expectOne<T>(value: unknown, guard: (item: unknown) => item is T): T {
  if (!guard(value)) throw new Error('Resposta inválida.');
  return value;
}

export function isCard(value: unknown): value is Card {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    typeof value['naipe'] === 'string' &&
    typeof value['valor'] === 'string' &&
    typeof value['url'] === 'string' &&
    typeof value['trucoStrength'] === 'number'
  );
}

export function isGame(value: unknown): value is Game {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    includes(GAME_STATUSES, value['status']) &&
    Array.isArray(value['players']) &&
    Array.isArray(value['rounds']) &&
    includes(POINTS_TO_WIN, value['pointsToWin'])
  );
}

export function isShop(value: unknown): value is Shop {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['status'] === 'boolean' &&
    typeof value['url'] === 'string' &&
    Array.isArray(value['itens'])
  );
}

export function isSkill(value: unknown): value is Skill {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['description'] === 'string' &&
    includes(SKILL_CATEGORIES, value['type']) &&
    includes(CARD_EFFECTS, value['effect']) &&
    typeof value['naipe'] === 'string' &&
    typeof value['valor'] === 'string'
  );
}

export function isPuzzle(value: unknown): value is Puzzle {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    typeof value['title'] === 'string' &&
    Array.isArray(value['alternativas']) &&
    value['alternativas'].every((item) => typeof item === 'string') &&
    typeof value['alternativaCorreta'] === 'number'
  );
}

export function isLobbyRoom(value: unknown): value is LobbyRoom {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['hostId'] === 'string' &&
    includes(LOBBY_VISIBILITIES, value['visibility']) &&
    (value['maxPlayers'] === 2 || value['maxPlayers'] === 4) &&
    Array.isArray(value['playerIds']) &&
    includes(POINTS_TO_WIN, value['pointsToWin']) &&
    includes(LOBBY_STATUSES, value['status'])
  );
}

export function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    typeof value['displayName'] === 'string' &&
    typeof value['username'] === 'string' &&
    typeof value['level'] === 'number' &&
    typeof value['experience'] === 'number' &&
    typeof value['experienceToNextLevel'] === 'number' &&
    typeof value['coins'] === 'number' &&
    typeof value['gems'] === 'number'
  );
}

export function isPlayerStats(value: unknown): value is PlayerStats {
  if (!isRecord(value)) return false;
  return ['matchesPlayed', 'wins', 'winRate', 'currentWinStreak', 'coins', 'gems'].every(
    (key) => typeof value[key] === 'number',
  );
}

export function isCollectionCard(value: unknown): value is CollectionCard {
  if (!isRecord(value)) return false;
  return (
    typeof value['name'] === 'string' &&
    includes(COLLECTION_RARITIES, value['rarity']) &&
    typeof value['level'] === 'number' &&
    typeof value['obtained'] === 'boolean'
  );
}

export function isAchievement(value: unknown): value is Achievement {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    typeof value['title'] === 'string' &&
    typeof value['description'] === 'string' &&
    typeof value['progress'] === 'number' &&
    typeof value['goal'] === 'number' &&
    typeof value['reward'] === 'string'
  );
}

export function isMatchActivity(value: unknown): value is MatchActivity {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    (value['result'] === 'VITORIA' || value['result'] === 'DERROTA') &&
    typeof value['opponentName'] === 'string' &&
    typeof value['playedAt'] === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function includes<T extends string | number>(options: readonly T[], value: unknown): value is T {
  return options.some((option) => option === value);
}
