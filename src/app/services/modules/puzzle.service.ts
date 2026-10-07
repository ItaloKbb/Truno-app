import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PuzzleDefinition } from '../../domain/truno-api';
import { API_BASE_URL } from '../config/api-config';
import { expectList, expectOne, isPuzzleDefinition, readApi } from '../config/api-response';

/**
 * Catálogo público de perguntas. Responder um desafio da partida é
 * `GameService.answerPuzzle`, que exige `gameId` e `challengeId`.
 */
@Injectable({ providedIn: 'root' })
export class PuzzleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/puzzles`;

  getAll(): Observable<PuzzleDefinition[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isPuzzleDefinition),
      'Falha ao carregar as perguntas.',
    );
  }

  getById(id: number): Observable<PuzzleDefinition> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/${id}`),
      (body) => expectOne(body, isPuzzleDefinition),
      'Falha ao carregar a pergunta.',
    );
  }
}
