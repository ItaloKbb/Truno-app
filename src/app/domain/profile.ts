export type ProfileVisibility = 'PUBLICO' | 'AMIGOS' | 'PRIVADO';

/** Perfil público da área `/perfil`, servido por `GET /api/profile`. */
export interface Profile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  coins: number;
  gems: number;
  favoriteCardId?: string;
}

/** Recorte persistido hoje no navegador pela tela de perfil. */
export interface StoredProfile {
  displayName: string;
  username: string;
  initials: string;
  avatarUrl: string;
  level: number;
}

export function profileUsername(nickname: string): string {
  return nickname.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'jogador';
}

export interface PlayerStats {
  matchesPlayed: number;
  wins: number;
  winRate: number;
  currentWinStreak: number;
  coins: number;
  gems: number;
}

export interface MatchActivity {
  id: string;
  result: 'VITORIA' | 'DERROTA';
  opponentName: string;
  playedAt: string;
}

export const COLLECTION_RARITIES = ['Comum', 'Rara', 'Épica', 'Lendária', 'Desconhecida'] as const;
export type CollectionRarity = (typeof COLLECTION_RARITIES)[number];

export interface CollectionCard {
  name: string;
  rarity: CollectionRarity;
  level: number;
  obtained: boolean;
}

export type CollectionFilter = 'all' | 'obtained' | 'missing';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  reward: string;
  unlockedAt?: string;
}

export interface ProfilePreferences {
  language: string;
  soundEffects: boolean;
  music: boolean;
  notifyMissions: boolean;
  notifyEvents: boolean;
  notifyChallenges: boolean;
  visibility: ProfileVisibility;
}

/** Preferências que a tela de configurações já grava. */
export type ProfileSettingKey = 'notifications' | 'sounds' | 'publicProfile';

export interface ProfileSettings {
  notifications: boolean;
  sounds: boolean;
  publicProfile: boolean;
}
