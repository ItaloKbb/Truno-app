import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const STORAGE_KEY = 'truno.music';
const MUSIC_SRC = 'assets/music.mp3';
const VOLUME = 0.28;

/**
 * Música de fundo do app inteiro, em loop. O navegador só deixa tocar áudio
 * depois de uma interação, então ela começa no primeiro toque ou tecla.
 */
@Injectable({ providedIn: 'root' })
export class BackgroundMusicService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private audio?: HTMLAudioElement;
  private unlocked = false;
  readonly enabled = signal(this.readEnabled());
  readonly playing = signal(false);

  /** Chamado uma vez pela raiz do app. */
  init(): void {
    if (!this.browser) return;
    const unlock = () => {
      this.unlocked = true;
      this.document.removeEventListener('pointerdown', unlock, true);
      this.document.removeEventListener('keydown', unlock, true);
      this.resume();
    };
    this.document.addEventListener('pointerdown', unlock, true);
    this.document.addEventListener('keydown', unlock, true);
    // Aba escondida não gasta bateria tocando música.
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.hidden) this.audio?.pause();
      else this.resume();
    });
  }

  toggle(): void {
    const enabled = !this.enabled();
    this.enabled.set(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Sem armazenamento a preferência vale só nesta sessão.
    }
    if (enabled) {
      this.unlocked = true;
      this.resume();
    } else {
      this.audio?.pause();
    }
  }

  private resume(): void {
    if (!this.browser || !this.unlocked || !this.enabled() || this.document.hidden) return;
    const audio = this.player();
    if (!audio) return;
    audio.play().catch(() => this.playing.set(false));
  }

  private player(): HTMLAudioElement | undefined {
    if (this.audio) return this.audio;
    try {
      const audio = new Audio(MUSIC_SRC);
      audio.loop = true;
      audio.volume = VOLUME;
      audio.preload = 'auto';
      audio.addEventListener('play', () => this.playing.set(true));
      audio.addEventListener('pause', () => this.playing.set(false));
      this.audio = audio;
    } catch {
      // Áudio indisponível: o app segue sem música.
    }
    return this.audio;
  }

  private readEnabled(): boolean {
    if (!this.browser) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  }
}
