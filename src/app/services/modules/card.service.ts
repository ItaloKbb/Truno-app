import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CatalogCard } from '../../domain/truno-api';
import { API_BASE_URL } from '../config/api-config';
import { expectList, expectOne, isCatalogCard, readApi } from '../config/api-response';

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/cards`;

  getAll(): Observable<CatalogCard[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isCatalogCard),
      'Falha ao carregar as cartas.',
    );
  }

  getById(id: number): Observable<CatalogCard> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/${id}`),
      (body) => expectOne(body, isCatalogCard),
      'Falha ao carregar a carta.',
    );
  }
}
