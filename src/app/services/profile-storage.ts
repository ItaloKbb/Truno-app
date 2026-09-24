import { Injectable } from '@angular/core';
import { profileUser } from '../pages/profile/profile.data';

type ProfileSettings = {
  notifications: boolean;
  sounds: boolean;
  publicProfile: boolean;
};

const profileStorageKey = 'truno.profile';
const settingsStorageKey = 'truno.profile.settings';

@Injectable({ providedIn: 'root' })
export class ProfileStorage {
  loadProfile(): typeof profileUser {
    if (typeof localStorage === 'undefined') return profileUser;

    const storedProfile = localStorage.getItem(profileStorageKey);
    if (!storedProfile) return profileUser;

    try {
      Object.assign(profileUser, JSON.parse(storedProfile));
    } catch {
      localStorage.removeItem(profileStorageKey);
    }

    return profileUser;
  }

  saveProfile(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(profileStorageKey, JSON.stringify(profileUser));
    }
  }

  loadSettings(): ProfileSettings {
    const defaults: ProfileSettings = { notifications: true, sounds: true, publicProfile: false };
    if (typeof localStorage === 'undefined') return defaults;

    const storedSettings = localStorage.getItem(settingsStorageKey);
    if (!storedSettings) return defaults;

    try {
      return { ...defaults, ...JSON.parse(storedSettings) };
    } catch {
      localStorage.removeItem(settingsStorageKey);
      return defaults;
    }
  }

  saveSettings(settings: ProfileSettings): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    }
  }
}
