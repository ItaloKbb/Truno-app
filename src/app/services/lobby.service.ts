import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CreateLobbyRoom, LobbyRoom } from '../domain/lobby';
import { expectList, expectOne, isLobbyRoom, readApi } from './api-response';

@Injectable({ providedIn: 'root' })
export class LobbyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/lobby/rooms';

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
