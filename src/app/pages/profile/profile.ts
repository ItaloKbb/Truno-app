import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Avatar } from '../../components/avatar/avatar';
import type { Achievement, MatchActivity, PlayerStats, Profile as UserProfile } from '../../domain/profile';
import { ProfileService } from '../../services/modules/profile.service';

@Component({
  imports: [AsyncPipe, DatePipe, Avatar],
  selector: 'app-profile',
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  // Service recebido do App via @Input
  @Input({ required: true }) profiles!: ProfileService;
  // Pedido de navegação, tratado pelo App
  @Output() navigate = new EventEmitter<string>();

  // Dados da tela: o template só carrega, sem lógica
  profile$!: Observable<UserProfile>;
  stats$!: Observable<PlayerStats>;
  achievements$!: Observable<Achievement[]>;
  activities$!: Observable<MatchActivity[]>;
  collection$!: Observable<{ obtained: number; total: number }>;

  ngOnInit(): void {
    this.profile$ = this.profiles.getProfile();
    this.stats$ = this.profiles.getStats();
    this.achievements$ = this.profiles.getAchievements();
    this.activities$ = this.profiles.getActivities();
    this.collection$ = this.profiles.getCollection().pipe(
      map((cards) => ({ obtained: cards.filter((card) => card.obtained).length, total: cards.length })),
    );
  }

  go(event: Event, url: string): void {
    event.preventDefault();
    this.navigate.emit(url);
  }
}
