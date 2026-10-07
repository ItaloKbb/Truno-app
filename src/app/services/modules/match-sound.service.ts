import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type MatchSound = 'card' | 'turn' | 'skill' | 'puzzle' | 'answer' | 'round' | 'trophy' | 'victory' | 'ready' | 'cancel' | 'error';

type Note = readonly [frequency: number, duration: number, delay: number];

const STORAGE_KEY = 'truno.match.sound';

const MELODIES: Record<MatchSound, readonly Note[]> = {
  card: [[290, 0.07, 0], [200, 0.08, 0.055]],
  turn: [[330, 0.09, 0], [470, 0.09, 0.09], [660, 0.18, 0.18]],
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

  play(effect: MatchSound, startDelay = 0): void {
    this.playNotes(
      MELODIES[effect],
      effect === 'card' || effect === 'turn' || effect === 'error' ? 'triangle' : 'sine',
      0.075,
      startDelay,
    );
  }

  /** Mais notas, alcance e volume conforme o naipe; subida para ganho, descida para perda. */
  playSurprise(power: number, positive: boolean): void {
    const strength = Math.max(1, Math.min(4, power));
    const notes: Note[] = Array.from({ length: strength + 2 }, (_, index) => [
      positive ? 370 + index * 115 : 640 - index * 95,
      0.12 + strength * 0.015,
      index * 0.085,
    ]);
    this.playNotes(notes, positive ? 'sine' : 'sawtooth', 0.035 + strength * 0.012);
  }

  /** Cada carta comprada acrescenta uma batida; naipes mais fortes terminam com acento mais alto. */
  playBuy(power: number, cardsDrawn: number, startDelay = 0): void {
    const strength = Math.max(2, Math.min(4, power));
    const count = Math.max(0, Math.min(strength, cardsDrawn));
    if (count === 0) {
      this.playNotes([[190, 0.18, 0]], 'triangle', 0.045, startDelay);
      return;
    }
    const notes: Note[] = Array.from({ length: count }, (_, index) => [
      290 + strength * 35 + index * 55,
      0.11,
      index * 0.11,
    ]);
    notes.push([620 + strength * 65, 0.2, count * 0.11]);
    this.playNotes(notes, 'triangle', 0.038 + strength * 0.012, startDelay);
  }

  private playNotes(notes: readonly Note[], wave: OscillatorType, volume: number, startDelay = 0): void {
    if (!this.enabled()) return;
    this.activate();
    const context = this.context;
    if (!context || context.state !== 'running') return;

    const start = context.currentTime + startDelay;
    for (const [frequency, duration, noteDelay] of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = start + noteDelay;
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
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
