import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { EMPTY, Subscription, catchError, exhaustMap, tap, timer } from 'rxjs';
import {
  SKILL_ICON,
  SKILL_LABEL,
  cardAsset,
  cardLabel,
  type GameCard,
  type GamePhase,
  type GamePlay,
  type GameState,
  type RoundWinner,
  type SkillDefinition,
  type SkillType,
} from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';
import { AuthSessionStore } from '../../services/modules/auth-session';
import { SkillService } from '../../services/modules/skill.service';
import { TurnFlames } from '../../components/turn-flames/turn-flames';

type NoticeKind = 'turn' | 'skill' | 'round';

interface MatchNotice {
  id: number;
  kind: NoticeKind;
  icon: string;
  title: string;
  detail: string;
}

const NOTICE_DURATION: Record<NoticeKind, number> = { turn: 2800, skill: 4500, round: 5000 };
const MAX_NOTICES = 4;

@Component({
  selector: 'app-partida',
  styleUrl: './partida.css',
  templateUrl: './partida.html',
  imports: [TurnFlames],
})
export class Partida implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) partidaId!: number;
  @Input({ required: true }) service!: GameService;

  private readonly authSession = inject(AuthSessionStore);
  private readonly skillService = inject(SkillService);
  private liveUpdates?: Subscription;
  private readonly noticeTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextNoticeId = 0;
  private skillCatalog: SkillDefinition[] = [];

  public readonly game = signal<GameState | null>(null);
  public readonly loading = signal(true);
  public readonly pending = signal(false);
  public readonly errorMessage = signal('');
  public readonly liveUpdateError = signal('');
  public readonly notices = signal<MatchNotice[]>([]);
  public readonly menuOpen = signal(false);

  ngOnInit(): void {
    // Só enriquece os avisos com nome/descrição; sem o catálogo usa SKILL_LABEL.
    this.skillService.getAll().subscribe({
      next: (skills) => (this.skillCatalog = skills),
      error: () => (this.skillCatalog = []),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['partidaId']) return;

    if (!Number.isInteger(this.partidaId) || this.partidaId <= 0) {
      this.liveUpdates?.unsubscribe();
      this.loading.set(false);
      this.errorMessage.set('Identificador de partida inválido.');
      this.game.set(null);
      return;
    }

    this.load();
  }

  public load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.game.set(null);

    this.service.getState(this.partidaId).subscribe({
      next: (game) => {
        this.applyState(game);
        this.loading.set(false);
        this.startLiveUpdates();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(error instanceof Error ? error.message : 'Falha ao carregar a partida.');
      },
    });
  }

  ngOnDestroy(): void {
    this.liveUpdates?.unsubscribe();
    this.noticeTimers.forEach((handle) => clearTimeout(handle));
    this.noticeTimers.clear();
  }

  public cardImage(card: GameCard | null): string {
    if (!card) return 'assets/cards/reverso.png';
    return cardAsset(card.valor, card.naipe);
  }

  public cardName(card: GameCard): string {
    return cardLabel(card.valor, card.naipe);
  }

  public skillIcon(type: SkillType): string {
    return SKILL_ICON[type];
  }

  public skillName(card: GameCard): string {
    return card.skill ? (this.skillFor(card)?.name ?? SKILL_LABEL[card.skill]) : '';
  }

  public phaseLabel(phase: GamePhase): string {
    switch (phase) {
      case 'AGUARDANDO_JOGADORES':
        return 'Aguardando jogadores';
      case 'EM_ANDAMENTO':
        return 'Partida em andamento';
      case 'ENTRE_RODADAS':
        return 'Fase de compra de troféus';
      case 'FINALIZADO':
        return 'Partida finalizada';
      case 'CANCELADO':
        return 'Partida cancelada';
    }
  }

  public directionLabel(direction: GameState['direction']): string {
    return direction === 'HORARIO' ? 'Horário' : 'Anti-horário';
  }

  public isCurrentPlayerReady(game: GameState): boolean {
    const nickname = this.myNickname();
    return !!nickname && game.players.some((player) => player.nickname === nickname && player.ready);
  }

  public isMyTurn(game: GameState): boolean {
    if (game.phase !== 'EM_ANDAMENTO' || game.currentPlayerId === null) return false;
    const nickname = this.myNickname();
    return !!nickname && game.players.some((player) => player.id === game.currentPlayerId && player.nickname === nickname);
  }

  public winnerName(game: GameState): string {
    const winner = game.players.find((player) => player.id === game.winnerPlayerId);
    return winner ? winner.nickname : '—';
  }

  public currentPlayerName(game: GameState): string {
    const current = game.players.find((player) => player.id === game.currentPlayerId);
    return current ? current.nickname : '—';
  }

  /** Mais recente primeiro, para o painel de vencedores. */
  public roundHistory(game: GameState): RoundWinner[] {
    return [...(game.roundWinners ?? [])].reverse();
  }

  /** Vencedor da rodada que acabou de fechar, enquanto as cartas ainda estão na mesa. */
  public isRoundWinnerPlay(game: GameState, play: GamePlay): boolean {
    if (game.phase !== 'ENTRE_RODADAS') return false;
    const result = game.roundWinners?.find((round) => round.roundNumber === game.roundNumber);
    return !!result && result.playerId === play.playerId;
  }

  public roundWins(game: GameState, playerId: number): number {
    return (game.roundWinners ?? []).filter((round) => round.playerId === playerId).length;
  }

  public toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  public dismissNotice(id: number): void {
    clearTimeout(this.noticeTimers.get(id));
    this.noticeTimers.delete(id);
    this.notices.update((list) => list.filter((notice) => notice.id !== id));
  }

  public play(handCardId: number | null): void {
    if (handCardId === null) return;
    this.run(this.service.playCard(this.partidaId, handCardId));
  }

  public start(): void {
    this.run(this.service.start(this.partidaId));
  }

  public answerPuzzle(challengeId: number, alternativeIndex: number): void {
    this.run(this.service.answerPuzzle(this.partidaId, challengeId, alternativeIndex));
  }

  public buyTrophy(): void {
    this.run(this.service.buyTrophy(this.partidaId));
  }

  public readyForNextRound(): void {
    this.run(this.service.readyForNextRound(this.partidaId));
  }

  public cancel(): void {
    this.menuOpen.set(false);
    this.run(this.service.cancel(this.partidaId));
  }

  private run(request: Observable<GameState>): void {
    this.pending.set(true);
    this.errorMessage.set('');

    request.subscribe({
      next: (updated) => {
        this.applyState(updated);
        this.pending.set(false);
        this.liveUpdateError.set('');
      },
      error: (error: unknown) => {
        this.pending.set(false);
        this.errorMessage.set(error instanceof Error ? error.message : 'A ação não pôde ser concluída.');
      },
    });
  }

  private startLiveUpdates(): void {
    this.liveUpdates?.unsubscribe();
    this.liveUpdates = timer(2000, 2000)
      .pipe(
        exhaustMap(() => {
          if (this.pending()) return EMPTY;

          return this.service.getState(this.partidaId).pipe(
            tap((updated) => {
              const current = this.game();
              if (!current || updated.stateVersion >= current.stateVersion) this.applyState(updated);
              this.liveUpdateError.set('');
            }),
            catchError((error: unknown) => {
              this.liveUpdateError.set(
                error instanceof Error ? error.message : 'Não foi possível atualizar a partida.',
              );
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe();
  }

  /** Troca o estado e anuncia o que mudou desde o anterior (skills, turno, rodada). */
  private applyState(updated: GameState): void {
    const previous = this.game();
    this.game.set(updated);

    if (previous) {
      this.announceSkills(previous, updated);
      this.announceRoundWinners(previous, updated);
    }
    this.announceTurn(previous, updated);
  }

  private announceSkills(previous: GameState, updated: GameState): void {
    const seen = new Set(previous.roundNumber === updated.roundNumber ? previous.plays.map((play) => play.order) : []);

    for (const play of updated.plays) {
      if (seen.has(play.order) || !play.card.skill) continue;
      const definition = this.skillFor(play.card);
      this.pushNotice({
        kind: 'skill',
        icon: SKILL_ICON[play.card.skill],
        title: `${this.displayName(play.nickname)} usou ${definition?.name ?? SKILL_LABEL[play.card.skill]}`,
        detail: definition?.description ?? `Carta ${this.cardName(play.card)}`,
      });
    }
  }

  private announceRoundWinners(previous: GameState, updated: GameState): void {
    const lastSeen = Math.max(0, ...(previous.roundWinners ?? []).map((round) => round.roundNumber));

    for (const round of updated.roundWinners ?? []) {
      if (round.roundNumber <= lastSeen) continue;
      this.pushNotice(
        round.nickname
          ? {
              kind: 'round',
              icon: '🏆',
              title: `${this.displayName(round.nickname)} venceu a rodada ${round.roundNumber}`,
              detail: `+${updated.settings.roundReward} moeda(s)`,
            }
          : {
              kind: 'round',
              icon: '🤝',
              title: `Rodada ${round.roundNumber} empatada`,
              detail: 'Ninguém levou a recompensa.',
            },
      );
    }
  }

  private announceTurn(previous: GameState | null, updated: GameState): void {
    if (updated.phase !== 'EM_ANDAMENTO' || updated.currentPlayerId === null) return;
    const turnChanged =
      !previous || previous.phase !== 'EM_ANDAMENTO' || previous.currentPlayerId !== updated.currentPlayerId;
    if (!turnChanged) return;

    // Só um aviso de turno por vez: o novo substitui o anterior.
    this.notices()
      .filter((notice) => notice.kind === 'turn')
      .forEach((notice) => this.dismissNotice(notice.id));

    const mine = this.isMyTurn(updated);
    this.pushNotice({
      kind: 'turn',
      icon: mine ? '🔥' : '⏳',
      title: mine ? 'Sua vez!' : `Vez de ${this.currentPlayerName(updated)}`,
      detail: mine ? 'Escolha uma carta da sua mão.' : 'Aguarde a jogada.',
    });
  }

  private pushNotice(notice: Omit<MatchNotice, 'id'>): void {
    const id = ++this.nextNoticeId;
    this.notices.update((list) => {
      const next = [...list, { ...notice, id }];
      next.slice(0, Math.max(0, next.length - MAX_NOTICES)).forEach((old) => {
        clearTimeout(this.noticeTimers.get(old.id));
        this.noticeTimers.delete(old.id);
      });
      return next.slice(-MAX_NOTICES);
    });
    this.noticeTimers.set(id, setTimeout(() => this.dismissNotice(id), NOTICE_DURATION[notice.kind]));
  }

  private skillFor(card: GameCard): SkillDefinition | undefined {
    return (
      this.skillCatalog.find((skill) => skill.valor === card.valor && skill.naipe === card.naipe) ??
      this.skillCatalog.find((skill) => skill.type === card.skill)
    );
  }

  private displayName(nickname: string): string {
    return nickname === this.myNickname() ? 'Você' : nickname;
  }

  private myNickname(): string | undefined {
    return this.authSession.session()?.user.nickname;
  }
}
