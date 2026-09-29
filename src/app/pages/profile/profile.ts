import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '../../components/avatar/avatar';
import { ProfileStorage } from '../../services/modules/profile-storage';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ProfileService } from '../../services/modules/profile.service';
@Component({
  imports: [AsyncPipe, DatePipe, DecimalPipe, Avatar, RouterLink],
  selector: 'app-profile',
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile {
  private readonly profiles = inject(ProfileService);
  protected readonly user = inject(ProfileStorage).loadProfile();
  protected readonly loadError = signal('');
  protected readonly overview$ = forkJoin({
    profile: this.profiles.getProfile(),
    stats: this.profiles.getStats(),
    collection: this.profiles.getCollection(),
    achievements: this.profiles.getAchievements(),
    activities: this.profiles.getActivities(),
  }).pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar o perfil.');
      return of(null);
    }),
  );

  protected obtained(cards: { obtained: boolean }[]): number {
    return cards.filter((card) => card.obtained).length;
  }

  protected collectionPercent(cards: { obtained: boolean }[]): number {
    return cards.length ? (this.obtained(cards) / cards.length) * 100 : 0;
  }

  protected rarityCount(cards: { obtained: boolean; rarity: string }[], rarity: string): number {
    return cards.filter((card) => card.obtained && card.rarity === rarity).length;
  }
}
