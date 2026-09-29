import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RankingEntry } from '../../domain/truno-api';
import { API_BASE_URL } from '../config/api-config';
import { expectList, isRankingEntry, readApi } from '../config/api-response';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/users/ranking`;

  getAll(): Observable<RankingEntry[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isRankingEntry),
      'Falha ao carregar o ranking.',
    );
  }
}
