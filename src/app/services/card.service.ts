import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Card } from '../domain/card';
import { expectList, expectOne, isCard, readApi } from './api-response';

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/cards';

  getAll(): Observable<Card[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isCard),
      'Falha ao carregar as cartas.',
    );
  }

  getById(id: string): Observable<Card> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/${id}`),
      (body) => expectOne(body, isCard),
      'Falha ao carregar a carta.',
    );
  }
}
