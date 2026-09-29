import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Puzzle } from '../domain/puzzle';
import { expectList, expectOne, isPuzzle, readApi } from './api-response';

@Injectable({ providedIn: 'root' })
export class PuzzleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/puzzles';

  getAll(): Observable<Puzzle[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isPuzzle),
      'Falha ao carregar as perguntas.',
    );
  }

  getById(id: string): Observable<Puzzle> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/${id}`),
      (body) => expectOne(body, isPuzzle),
      'Falha ao carregar a pergunta.',
    );
  }
}
