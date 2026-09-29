import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Shop } from '../../domain/shop';
import { expectOne, isShop, readApi } from '../config/api-response';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly http = inject(HttpClient);

  get(): Observable<Shop> {
    return readApi(
      this.http.get<unknown>('/api/shop'),
      (body) => expectOne(body, isShop),
      'Falha ao carregar a loja.',
    );
  }
}
