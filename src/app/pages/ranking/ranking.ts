import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Injector, Input, OnInit, Output, Signal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import type { RankingEntry } from '../../domain/truno-api';
import { RankingService } from '../../services/modules/ranking.service';

/** Entrada com a posição visual: a API ordena, a tela só numera. */
export interface RankingRow extends RankingEntry {
  position: number;
}

type RankingState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rows: RankingRow[] };

@Component({
  imports: [DecimalPipe],
  selector: 'app-ranking',
  styleUrls: ['../lobby/lobby.css', './ranking.css'],
  templateUrl: './ranking.html',
})
export class Ranking implements OnInit {
  // Service recebido do App via @Input
  @Input({ required: true }) ranking!: RankingService;
  // Id do jogador logado, para destacar a linha dele
  @Input() playerId: number | null = null;
  // Pedido de navegação, tratado pelo App
  @Output() navigate = new EventEmitter<string>();

  private readonly injector = inject(Injector);
  private readonly reload$ = new Subject<void>();

  protected readonly query = signal('');
  protected state: Signal<RankingState> = signal({ status: 'loading' });

  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });

  protected readonly rows = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.rows : [];
  });

  /** Os três primeiros, na ordem visual do pódio: 2º, 1º, 3º. */
  protected readonly podium = computed(() => {
    const [first, second, third] = this.rows();
    return [second, first, third].filter((row): row is RankingRow => !!row);
  });

  protected readonly me = computed(() => this.rows().find((row) => row.id === this.playerId) ?? null);

  protected readonly filtered = computed(() => {
    const term = this.query().trim().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter((row) => row.nickname.toLowerCase().includes(term));
  });

  protected readonly totalPoints = computed(() => this.rows().reduce((sum, row) => sum + row.rankingPoints, 0));

  /** Pontos que faltam para alcançar a posição imediatamente acima. */
  protected readonly gapToNext = computed(() => {
    const me = this.me();
    if (!me || me.position === 1) return null;
    const above = this.rows()[me.position - 2];
    return Math.max(above.rankingPoints - me.rankingPoints, 0);
  });

  ngOnInit(): void {
    const state$ = this.reload$.pipe(
      startWith(undefined),
      switchMap(() =>
        this.ranking.getAll().pipe(
          map((entries): RankingState => ({
            status: 'ready',
            rows: entries.map((entry, index) => ({ ...entry, position: index + 1 })),
          })),
          catchError((error: unknown) =>
            of<RankingState>({
              status: 'error',
              message: error instanceof Error ? error.message : 'Falha ao carregar o ranking.',
            }),
          ),
          startWith<RankingState>({ status: 'loading' }),
        ),
      ),
    );
    this.state = toSignal(state$, { injector: this.injector, requireSync: true });
  }

  reload(): void {
    this.reload$.next();
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.query.set('');
  }

  medal(position: number): string {
    return position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
  }

  initials(nickname: string): string {
    return (
      nickname
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase() || '?'
    );
  }

  go(event: Event, url: string): void {
    event.preventDefault();
    this.navigate.emit(url);
  }
}
