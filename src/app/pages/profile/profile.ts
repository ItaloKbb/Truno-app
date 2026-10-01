import { Component, Input, OnInit, output, signal } from '@angular/core';
import { Avatar } from '../../components/avatar/avatar';
import { ProfileStorage } from '../../services/modules/profile-storage';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ProfileService } from '../../services/modules/profile.service';

function loadOverview(profiles: ProfileService, onError: (message: string) => void) {
  return forkJoin({
    profile: profiles.getProfile(),
    stats: profiles.getStats(),
    collection: profiles.getCollection(),
    achievements: profiles.getAchievements(),
    activities: profiles.getActivities(),
  }).pipe(
    catchError((error: unknown) => {
      onError(error instanceof Error ? error.message : 'Falha ao carregar o perfil.');
      return of(null);
    }),
  );
}

@Component({
  imports: [AsyncPipe, DatePipe, DecimalPipe, Avatar],
  selector: 'app-profile',
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  @Input({ required: true }) profiles!: ProfileService;
  @Input({ required: true }) profileStorage!: ProfileStorage;
  readonly navigate = output<string>();

  protected user!: ReturnType<ProfileStorage['loadProfile']>;
  protected readonly loadError = signal('');
  protected overview$!: ReturnType<typeof loadOverview>;

  ngOnInit(): void {
    this.user = this.profileStorage.loadProfile();
    this.overview$ = loadOverview(this.profiles, (message) => this.loadError.set(message));
  }

  protected go(event: Event, url: string): void {
    event.preventDefault();
    this.navigate.emit(url);
  }

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
