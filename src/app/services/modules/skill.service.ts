import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SkillDefinition } from '../../domain/truno-api';
import { API_BASE_URL } from '../config/api-config';
import { expectList, isSkillDefinition, readApi } from '../config/api-response';

/** A API só expõe a listagem (`GET /skills`); não há busca por id. */
@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/skills`;

  getAll(): Observable<SkillDefinition[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isSkillDefinition),
      'Falha ao carregar as habilidades.',
    );
  }
}
