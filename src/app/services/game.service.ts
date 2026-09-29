import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Game } from '../domain/game';
import { expectList, expectOne, isGame, readApi } from './api-response';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/games';

  getAll(): Observable<Game[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isGame),
      'Falha ao carregar as partidas.',
    );
  }

  getById(id: string): Observable<Game> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/${id}`),
      (body) => expectOne(body, isGame),
      'Falha ao carregar a partida.',
    );
  }
}
