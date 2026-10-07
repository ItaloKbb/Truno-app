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

  /** Puxão rápido e um "tlim" por item levado: moedas soam agudas, cartas raspam; escudo encerra em batida seca. */
  playTheft(power: number, coins: boolean, amount: number, blocked: boolean, startDelay = 0): void {
    const strength = Math.max(2, Math.min(3, power));
    const notes: Note[] = [[700 + strength * 60, 0.06, 0], [420, 0.08, 0.05]];
    if (blocked) {
      notes.push([170, 0.22, 0.16]);
      this.playNotes(notes, 'triangle', 0.05, startDelay);
      return;
    }
    const count = Math.max(0, Math.min(strength, amount));
    for (let index = 0; index < count; index++) {
      const at = 0.16 + index * 0.1;
      notes.push(coins ? [1200 + index * 160, 0.09, at] : [520 + index * 70, 0.07, at]);
    }
    // Força 3 fecha com uma risada de vilão em duas notas.
    if (strength === 3) notes.push([300, 0.12, 0.2 + count * 0.1], [240, 0.18, 0.32 + count * 0.1]);
    this.playNotes(notes, coins ? 'square' : 'triangle', 0.028 + strength * 0.01, startDelay);
  }

  /** Suspense do desafio: o motivo de pergunta repete e sobe um degrau por ponto de força. */
  playPuzzle(power: number, startDelay = 0): void {
    const strength = Math.max(1, Math.min(4, power));
    const notes: Note[] = [];
    for (let step = 0; step < strength; step++) {
      const base = 440 + step * 70;
      const at = step * 0.24;
      notes.push([base, 0.1, at], [base * 1.26, 0.1, at + 0.1]);
    }
    notes.push([440 + strength * 90, 0.22, strength * 0.24]);
    this.playNotes(notes, 'sine', 0.045 + strength * 0.01, startDelay);
  }

  /** Acerto sobe em arpejo brilhante; erro desce em zumbido. Naipes fortes alongam e reforçam. */
  playPuzzleResult(power: number, correct: boolean, startDelay = 0): void {
    const strength = Math.max(1, Math.min(4, power));
    if (correct) {
      const notes: Note[] = Array.from({ length: strength + 2 }, (_, index) => [
        523 * 2 ** (index / 4),
        0.12 + strength * 0.02,
        index * 0.08,
      ]);
      // Força alta fecha com um acorde agudo.
      if (strength >= 3) {
        const end = (strength + 2) * 0.08;
        notes.push([1047, 0.32, end], [1319, 0.32, end], ...(strength === 4 ? [[1568, 0.4, end] as const] : []));
      }
      this.playNotes(notes, 'sine', 0.04 + strength * 0.012, startDelay);
      return;
    }
    const notes: Note[] = Array.from({ length: strength + 1 }, (_, index) => [
      330 - index * (30 + strength * 6),
      0.14 + strength * 0.02,
      index * 0.12,
    ]);
    this.playNotes(notes, 'sawtooth', 0.03 + strength * 0.012, startDelay);
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
