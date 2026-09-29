import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  Achievement,
  CollectionCard,
  MatchActivity,
  PlayerStats,
  Profile,
} from '../domain/profile';
import {
  expectList,
  expectOne,
  isAchievement,
  isCollectionCard,
  isMatchActivity,
  isPlayerStats,
  isProfile,
  readApi,
} from './api-response';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/profile';

  getProfile(): Observable<Profile> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectOne(body, isProfile),
      'Falha ao carregar o perfil.',
    );
  }

  getStats(): Observable<PlayerStats> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/stats`),
      (body) => expectOne(body, isPlayerStats),
      'Falha ao carregar as estatísticas.',
    );
  }

  getCollection(): Observable<CollectionCard[]> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/collection`),
      (body) => expectList(body, isCollectionCard),
      'Falha ao carregar a coleção.',
    );
  }

  getAchievements(): Observable<Achievement[]> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/achievements`),
      (body) => expectList(body, isAchievement),
      'Falha ao carregar as conquistas.',
    );
  }

  getActivities(): Observable<MatchActivity[]> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/activities`),
      (body) => expectList(body, isMatchActivity),
      'Falha ao carregar o histórico.',
    );
  }
}
