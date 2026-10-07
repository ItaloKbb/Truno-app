import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type MatchSound = 'card' | 'turn' | 'skill' | 'puzzle' | 'answer' | 'round' | 'trophy' | 'victory' | 'ready' | 'cancel' | 'error';

type Note = readonly [frequency: number, duration: number, delay: number];

const STORAGE_KEY = 'truno.match.sound';

const MELODIES: Record<MatchSound, readonly Note[]> = {
  card: [[290, 0.07, 0], [200, 0.08, 0.055]],
  turn: [[520, 0.1, 0], [700, 0.15, 0.1]],
  skill: [[360, 0.1, 0], [610, 0.12, 0.09], [860, 0.18, 0.18]],
  puzzle: [[440, 0.1, 0], [554, 0.1, 0.11], [440, 0.18, 0.22]],
  answer: [[520, 0.1, 0], [660, 0.18, 0.1]],
  round: [[392, 0.12, 0], [523, 0.12, 0.12], [784, 0.24, 0.24]],
  trophy: [[523, 0.12, 0], [659, 0.12, 0.12], [784, 0.16, 0.24], [1047, 0.3, 0.4]],
  victory: [[392, 0.12, 0], [523, 0.12, 0.12], [659, 0.12, 0.24], [784, 0.16, 0.36], [1047, 0.36, 0.54]],
  ready: [[580, 0.09, 0]],
  cancel: [[330, 0.12, 0], [245, 0.18, 0.12]],
  error: [[220, 0.14, 0], [175, 0.2, 0.13]],
};

@Injectable({ providedIn: 'root' })
export class MatchSoundService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private context?: AudioContext;
  readonly enabled = signal(this.readEnabled());

  toggle(): void {
    const enabled = !this.enabled();
    this.enabled.set(enabled);
    if (this.browser) {
      try {
        localStorage.setItem(STORAGE_KEY, String(enabled));
      } catch {
        // O controle ainda funciona nesta sessão quando o armazenamento está bloqueado.
      }
    }
    if (enabled) {
      this.activate();
      this.play('ready');
    }
  }

  /** A primeira interação libera o áudio conforme as regras do navegador. */
  activate(): void {
    if (!this.browser || !this.enabled()) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch {
      // Áudio indisponível: a partida continua normalmente.
    }
  }

  play(effect: MatchSound): void {
    if (!this.enabled()) return;
    this.activate();
    const context = this.context;
    if (!context || context.state !== 'running') return;

    const start = context.currentTime;
    for (const [frequency, duration, delay] of MELODIES[effect]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = start + delay;
      oscillator.type = effect === 'card' || effect === 'error' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.075, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.01);
    }
  }

  private readEnabled(): boolean {
    if (!this.browser) return true;
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  }
}
