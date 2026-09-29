import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Skill } from '../domain/skill';
import { expectList, expectOne, isSkill, readApi } from './api-response';

@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/skills';

  getAll(): Observable<Skill[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isSkill),
      'Falha ao carregar as habilidades.',
    );
  }

  getById(id: string): Observable<Skill> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/${id}`),
      (body) => expectOne(body, isSkill),
      'Falha ao carregar a habilidade.',
    );
  }
}
