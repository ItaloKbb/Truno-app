import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { isApiMessage } from '../../domain/auth';
import { COLLECTION_RARITIES, type Achievement, type CollectionCard, type MatchActivity, type PlayerStats, type Profile } from '../../domain/profile';
import type { Shop } from '../../domain/shop';
import {
  CARD_SUITS,
  CARD_VALUES,
  GAME_DIRECTIONS,
  GAME_PHASES,
  SKILL_TYPES,
  type CatalogCard,
  type GameState,
  type PuzzleDefinition,
  type RankingEntry,
  type SkillDefinition,
} from '../../domain/truno-api';

/** Falha da API com o status HTTP e a mensagem devolvida pelo servidor. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 409: o estado mudou; consulte o estado da partida antes de tentar de novo. */
  get isConflict(): boolean {
    return this.status === 409;
  }
}

export function readApi<T>(
  source: Observable<unknown>,
  parse: (body: unknown) => T,
  message: string,
): Observable<T> {
  return source.pipe(
    map((body) => parse(body)),
    catchError((error: unknown) => {
      console.error(message, error);
      if (error instanceof HttpErrorResponse) {
        const apiMessage = isApiMessage(error.error) ? error.error.message : message;
        return throwError(() => new ApiError(apiMessage, error.status));
      }
      return throwError(() => new ApiError(message, -1));
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

export function isCatalogCard(value: unknown): value is CatalogCard {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'number' &&
    includes(CARD_VALUES, value['valor']) &&
    includes(CARD_SUITS, value['naipe']) &&
    typeof value['url'] === 'string'
  );
}

export function isSkillDefinition(value: unknown): value is SkillDefinition {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'number' &&
    typeof value['name'] === 'string' &&
    typeof value['description'] === 'string' &&
    includes(SKILL_TYPES, value['type']) &&
    includes(CARD_SUITS, value['naipe']) &&
    includes(CARD_VALUES, value['valor'])
  );
}

export function isPuzzleDefinition(value: unknown): value is PuzzleDefinition {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'number' &&
    typeof value['question'] === 'string' &&
    Array.isArray(value['alternativas']) &&
    value['alternativas'].every((item) => typeof item === 'string')
  );
}

export function isRankingEntry(value: unknown): value is RankingEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'number' &&
    typeof value['nickname'] === 'string' &&
    typeof value['rankingPoints'] === 'number'
  );
}

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'number' &&
    typeof value['code'] === 'string' &&
    typeof value['name'] === 'string' &&
    includes(GAME_PHASES, value['phase']) &&
    typeof value['stateVersion'] === 'number' &&
    isRecord(value['settings']) &&
    includes(GAME_DIRECTIONS, value['direction']) &&
    typeof value['roundNumber'] === 'number' &&
    Array.isArray(value['players']) &&
    Array.isArray(value['plays']) &&
    Array.isArray(value['hand'])
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
