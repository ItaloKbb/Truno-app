import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { POINTS_TO_WIN } from '../domain/game';
import {
  LOBBY_STATUSES,
  LOBBY_VISIBILITIES,
  type CreateLobbyRoom,
  type LobbyRoom,
  type TableSize,
} from '../domain/lobby';
import { API_BASE_URL } from './config/api-config';
import { expectList, expectOne, readApi } from './config/api-response';

@Injectable({ providedIn: 'root' })
export class LobbyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/api/lobby/rooms`;

  getAll(): Observable<LobbyRoom[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isLobbyRoom),
      'Falha ao carregar as mesas.',
    );
  }

  getById(id: string): Observable<LobbyRoom> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/${id}`),
      (body) => expectOne(body, isLobbyRoom),
      'Falha ao carregar a mesa.',
    );
  }

  create(room: CreateLobbyRoom): Observable<LobbyRoom> {
    return readApi(
      this.http.post<unknown>(this.apiUrl, room),
      (body) => expectOne(body, isLobbyRoom),
      'Falha ao criar a mesa.',
    );
  }
}

function isLobbyRoom(value: unknown): value is LobbyRoom {
  if (!value || typeof value !== 'object') return false;
  const room = value as Record<string, unknown>;
  return (
    typeof room['id'] === 'string' &&
    typeof room['name'] === 'string' &&
    typeof room['hostId'] === 'string' &&
    includes(LOBBY_VISIBILITIES, room['visibility']) &&
    isTableSize(room['maxPlayers']) &&
    Array.isArray(room['playerIds']) &&
    room['playerIds'].every((playerId) => typeof playerId === 'string') &&
    includes(POINTS_TO_WIN, room['pointsToWin']) &&
    includes(LOBBY_STATUSES, room['status'])
  );
}

function isTableSize(value: unknown): value is TableSize {
  return value === 2 || value === 4;
}

function includes<T extends string | number>(options: readonly T[], value: unknown): value is T {
  return options.some((option) => option === value);
}