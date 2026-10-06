import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Avatar } from '../../components/avatar/avatar';
import type {
  Achievement,
  CollectionCard,
  MatchActivity,
  PlayerStats,
  Profile as UserProfile,
} from '../../domain/profile';
import { messageFromApi } from '../../services/modules/auth.service';
import { ProfileService } from '../../services/modules/profile.service';

interface ProfileOverview {
  profile: UserProfile;
  stats: PlayerStats;
  collection: CollectionCard[];
  achievements: Achievement[];
  activities: MatchActivity[];
}

type ProfileState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; overview: ProfileOverview };

@Component({
  imports: [Avatar, DatePipe, DecimalPipe, PercentPipe],
  styleUrls: ['../lobby/lobby.css', './profile.css'],
  selector: 'app-profile',
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  @Input({ required: true }) profiles!: ProfileService;
  @Output() navigate = new EventEmitter<string>();

  private readonly destroyRef = inject(DestroyRef);
  protected readonly state = signal<ProfileState>({ status: 'loading' });

  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });

  protected readonly overview = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.overview : null;
  });

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.state.set({ status: 'loading' });
    forkJoin({
      profile: this.profiles.getProfile(),
      stats: this.profiles.getStats(),
      collection: this.profiles.getCollection(),
      achievements: this.profiles.getAchievements(),
      activities: this.profiles.getActivities(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (overview) => this.state.set({ status: 'ready', overview }),
        error: (error: unknown) =>
          this.state.set({
            status: 'error',
            message: messageFromApi(error, 'Falha ao carregar o perfil.'),
          }),
      });
  }

  protected obtainedCount(cards: CollectionCard[]): number {
    return cards.filter((card) => card.obtained).length;
  }

  protected unlockedCount(achievements: Achievement[]): number {
    return achievements.filter((achievement) => !!achievement.unlockedAt).length;
  }

  protected experienceProgress(profile: UserProfile): number {
    if (profile.experienceToNextLevel <= 0) return 0;
    return Math.min(100, Math.max(0, (profile.experience / profile.experienceToNextLevel) * 100));
  }

  protected go(url: string): void {
    this.navigate.emit(url);
  }
}
