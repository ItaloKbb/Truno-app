import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CreateGameInput, GameState } from '../../domain/truno-api';
import { API_BASE_URL } from '../config/api-config';
import { expectOne, isGameState, readApi } from '../config/api-response';

/**
 * Todas as operações de partida. Cada mutação devolve o `GameState` agregado
 * e atualizado: a tela troca o estado local por ele. O token vai no
 * `X-Player-Token` pelo interceptor.
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/games`;

  create(input: CreateGameInput): Observable<GameState> {
    return this.send('post', this.apiUrl, { ...input, name: input.name.trim() }, 'Falha ao criar a partida.');
  }

  access(code: string): Observable<GameState> {
    return this.send(
      'post',
      `${this.apiUrl}/access`,
      { code: code.trim().toUpperCase() },
      'Falha ao entrar na partida.',
    );
  }

  start(gameId: number): Observable<GameState> {
    return this.send('post', `${this.apiUrl}/${gameId}/start`, null, 'Falha ao iniciar a partida.');
  }

  getState(gameId: number): Observable<GameState> {
    return this.send('get', `${this.apiUrl}/${gameId}/state`, null, 'Falha ao carregar a partida.');
  }

  playCard(gameId: number, handCardId: number): Observable<GameState> {
    return this.send('post', `${this.apiUrl}/${gameId}/plays`, { handCardId }, 'Falha ao jogar a carta.');
  }

  answerPuzzle(gameId: number, challengeId: number, alternativeIndex: number): Observable<GameState> {
    return this.send(
      'post',
      `${this.apiUrl}/${gameId}/puzzle-answers`,
      { challengeId, alternativeIndex },
      'Falha ao responder a pergunta.',
    );
  }

  buyTrophy(gameId: number): Observable<GameState> {
    return this.send('post', `${this.apiUrl}/${gameId}/trophies`, null, 'Falha ao comprar o troféu.');
  }

  readyForNextRound(gameId: number): Observable<GameState> {
    return this.send('post', `${this.apiUrl}/${gameId}/ready`, null, 'Falha ao confirmar a rodada.');
  }

  cancel(gameId: number): Observable<GameState> {
    return this.send('post', `${this.apiUrl}/${gameId}/cancel`, null, 'Falha ao cancelar a partida.');
  }

  private send(
    method: 'get' | 'post',
    url: string,
    body: object | null,
    message: string,
  ): Observable<GameState> {
    const request =
      method === 'get' ? this.http.get<unknown>(url) : this.http.post<unknown>(url, body);
    return readApi(request, (response) => expectOne(response, isGameState), message);
  }
}
