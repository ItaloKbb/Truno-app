import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { EMPTY, Subscription, catchError, exhaustMap, tap, timer } from 'rxjs';
import {
  BUY_POWER,
  PUZZLE_POWER,
  THEFT_POWER,
  skillIconAsset,
  SKILL_LABEL,
  SURPRISE_POWER,
  cardAsset,
  cardLabel,
  type GameCard,
  type GameDirection,
  type GamePhase,
  type GamePlay,
  type GamePlayer,
  type GameState,
  type TheftKind,
  type RoundWinner,
  type SkillDefinition,
  type SkillType,
} from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';
import { AuthSessionStore } from '../../services/modules/auth-session';
import { SkillService } from '../../services/modules/skill.service';
import { ChatService } from '../../services/modules/chat.service';
import { MatchSoundService, type MatchSound } from '../../services/modules/match-sound.service';
import { TurnFlames } from '../../components/turn-flames/turn-flames';
import { SkillBurst } from '../../components/skill-burst/skill-burst';
import { RoundBanner, type RoundResult } from '../../components/round-banner/round-banner';

type NoticeKind = 'turn' | 'skill' | 'error';

interface MatchNotice {
  id: number;
  kind: NoticeKind;
  icon: string;
  iconAsset?: string;
  title: string;
  detail: string;
}

interface SkillBurstItem {
  id: number;
  type: SkillType;
  direction: GameDirection | null;
  delay: number;
  duration: number;
  power: number;
  roll: number | null;
  coinDelta: number | null;
  cardsDrawn: number | null;
  puzzleCorrect: boolean | null;
  puzzleAmount: number | null;
  theftKind: TheftKind | null;
  theftAmount: number | null;
  theftBlocked: boolean;
}

const NOTICE_DURATION: Record<NoticeKind, number> = { turn: 2800, skill: 4500, error: 3500 };
const MAX_NOTICES = 4;
const BURST_DURATION = 1800;
const BURST_STAGGER = 350;
const MAX_BURSTS = 3;
const AUTO_READY_SECONDS = 3;
const ROUND_BANNER_DURATION = 4000;
const PLAYER_POP_DURATION = 3500;
const TURN_RIM_DURATION = 1250;
const SHARE_COOLDOWN = 5000;

@Component({
  selector: 'app-partida',
  styleUrls: ['./partida.css', './partida.result.css', './partida.puzzle.css', './partida.turn.css', './partida.mobile.css'],
  templateUrl: './partida.html',
  imports: [TurnFlames, SkillBurst, RoundBanner],
})
export class Partida implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) partidaId!: number;
  @Input({ required: true }) service!: GameService;
  @Output() navigate = new EventEmitter<string>();

  private readonly authSession = inject(AuthSessionStore);
  private readonly skillService = inject(SkillService);
  private readonly chat = inject(ChatService);
  public readonly sounds = inject(MatchSoundService);
  private liveUpdates?: Subscription;
  private readonly noticeTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextNoticeId = 0;
  private readonly burstTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private autoReadyTimer?: ReturnType<typeof setInterval>;
  private roundBannerTimer?: ReturnType<typeof setTimeout>;
  private playerPopTimer?: ReturnType<typeof setTimeout>;
  private turnRimTimer?: ReturnType<typeof setTimeout>;
  private nextBurstId = 0;
  private nextTurnEffectId = 0;
  private skillCatalog: SkillDefinition[] = [];

  public readonly game = signal<GameState | null>(null);
  public readonly loading = signal(true);
  public readonly pending = signal(false);
  public readonly errorMessage = signal('');
  public readonly liveUpdateError = signal('');
  public readonly notices = signal<MatchNotice[]>([]);
  public readonly skillBursts = signal<SkillBurstItem[]>([]);
  public readonly menuOpen = signal(false);
  /** Segundos até o "pronto" automático; null quando não há contagem. */
  public readonly autoReadyIn = signal<number | null>(null);
  public readonly roundBanner = signal<RoundResult | null>(null);
  public readonly selectedPlayerId = signal<number | null>(null);
  public readonly turnEffects = signal<number[]>([]);
  /** Bloqueia o "Enviar no chat" durante o envio e por um tempo depois, contra spam. */
  public readonly sharing = signal(false);

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
    clearTimeout(this.turnRimTimer);
    this.turnEffects.set([]);
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
    this.burstTimers.forEach((handle) => clearTimeout(handle));
    this.burstTimers.clear();
    this.stopAutoReady();
    clearTimeout(this.roundBannerTimer);
    clearTimeout(this.playerPopTimer);
    clearTimeout(this.turnRimTimer);
  }

  public cardImage(card: GameCard | null): string {
    if (!card) return 'assets/cards/reverso.png';
    return cardAsset(card.valor, card.naipe);
  }

  public cardName(card: GameCard): string {
    return cardLabel(card.valor, card.naipe);
  }

  public skillIcon(type: SkillType, surpriseRoll: number | null = null, direction: GameState['direction'] | null = null): string {
    return skillIconAsset(type, { surpriseRoll, direction });
  }

  public directionAfterPlay(game: GameState, play: GamePlay): GameDirection {
    const laterInversions = game.plays.filter((candidate) => candidate.order > play.order && candidate.card.skill === 'INVERTS').length;
    if (laterInversions % 2 === 0) return game.direction;
    return game.direction === 'HORARIO' ? 'ANTI_HORARIO' : 'HORARIO';
  }

  public skillName(card: GameCard): string {
    return card.skill ? (this.skillFor(card)?.name ?? SKILL_LABEL[card.skill]) : '';
  }

  public surpriseDeltaLabel(play: GamePlay): string {
    const change = play.surpriseCoinDelta ?? play.surpriseRoll ?? 0;
    return `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)} 🪙`;
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
    return !!this.myPlayer(game)?.ready;
  }

  public isMyTurn(game: GameState): boolean {
    if (game.phase !== 'EM_ANDAMENTO' || game.currentPlayerId === null) return false;
    const nickname = this.myNickname();
    return !!nickname && game.players.some((player) => player.id === game.currentPlayerId && player.nickname === nickname);
  }

  public canAnswerPuzzle(game: GameState): boolean {
    return !!game.pendingPuzzle && game.roundStatus === 'AGUARDANDO_PUZZLE' && this.isMyTurn(game);
  }

  public winnerName(game: GameState): string {
    const winner = game.players.find((player) => player.id === game.winnerPlayerId);
    return winner ? winner.nickname : '—';
  }

  public didIWin(game: GameState): boolean {
    return game.winnerPlayerId !== null && this.myPlayer(game)?.id === game.winnerPlayerId;
  }

  public finalStandings(game: GameState): GamePlayer[] {
    return [...game.players].sort(
      (a, b) => Number(b.id === game.winnerPlayerId) - Number(a.id === game.winnerPlayerId) || b.trophies - a.trophies,
    );
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

  /** Só a primeira letra do apelido, para o avatar do celular. */
  public initial(nickname: string): string {
    return [...nickname.trim()][0]?.toUpperCase() ?? '?';
  }

  public isMe(player: GamePlayer): boolean {
    return player.nickname === this.myNickname();
  }

  public roundWins(game: GameState, playerId: number): number {
    return (game.roundWinners ?? []).filter((round) => round.playerId === playerId).length;
  }

  public toggleMenu(): void {
    this.closePlayer();
    this.menuOpen.update((open) => !open);
  }

  /** Balão do avatar no celular: toque abre/fecha, e some sozinho. */
  public togglePlayer(playerId: number): void {
    if (this.selectedPlayerId() === playerId) {
      this.closePlayer();
      return;
    }
    clearTimeout(this.playerPopTimer);
    this.selectedPlayerId.set(playerId);
    this.playerPopTimer = setTimeout(() => this.closePlayer(), PLAYER_POP_DURATION);
  }

  private closePlayer(): void {
    clearTimeout(this.playerPopTimer);
    this.playerPopTimer = undefined;
    this.selectedPlayerId.set(null);
  }

  /** Tempo de vida do aviso, para o CSS sincronizar o desbotamento com a remoção. */
  public noticeLife(kind: NoticeKind): number {
    return NOTICE_DURATION[kind];
  }

  public dismissNotice(id: number): void {
    clearTimeout(this.noticeTimers.get(id));
    this.noticeTimers.delete(id);
    this.notices.update((list) => list.filter((notice) => notice.id !== id));
  }

  public play(handCardId: number | null): void {
    const game = this.game();
    if (handCardId === null || !game || this.pending() || !this.isMyTurn(game) || !!game.pendingPuzzle) return;
    this.run(this.service.playCard(this.partidaId, handCardId));
  }

  public start(): void {
    this.run(this.service.start(this.partidaId));
  }

  /** Divulga o código da mesa no chat do lobby; quem estiver lá entra pelo convite. */
  public shareCode(game: GameState): void {
    if (this.sharing()) return;
    this.sharing.set(true);

    this.chat.send(`Partida "${game.name}": ${game.code}. Bora jogar!`).subscribe({
      next: () => {
        this.pushNotice({ kind: 'skill', icon: '💬', title: 'Convite enviado', detail: `Código ${game.code} publicado no chat do lobby.` });
        setTimeout(() => this.sharing.set(false), SHARE_COOLDOWN);
      },
      error: (error: unknown) => {
        this.sharing.set(false);
        this.notifyError('⚠️', 'Chat indisponível', error instanceof Error ? error.message : 'Não foi possível enviar o convite.');
      },
    });
  }

  public answerPuzzle(challengeId: number, alternativeIndex: number): void {
    const game = this.game();
    if (!game || this.pending() || !this.canAnswerPuzzle(game) || game.pendingPuzzle?.challengeId !== challengeId) return;
    this.run(this.service.answerPuzzle(this.partidaId, challengeId, alternativeIndex));
  }

  public buyTrophy(): void {
    const game = this.game();
    const me = game && this.myPlayer(game);
    if (game && me && me.matchCoins < game.settings.trophyPrice) {
      this.notifyError(
        '🪙',
        'Moedas insuficientes',
        `O troféu custa ${game.settings.trophyPrice} moeda(s); você tem ${me.matchCoins}.`,
      );
      return;
    }
    this.run(this.service.buyTrophy(this.partidaId));
  }

  public readyForNextRound(): void {
    this.stopAutoReady();
    this.run(this.service.readyForNextRound(this.partidaId));
  }

  public cancel(): void {
    this.menuOpen.set(false);
    this.run(this.service.cancel(this.partidaId));
  }

  private run(request: Observable<GameState>): void {
    this.pending.set(true);

    request.subscribe({
      next: (updated) => {
        this.applyState(updated);
        this.pending.set(false);
        this.liveUpdateError.set('');
      },
      // Erro de ação vira aviso: o tabuleiro continua na tela.
      error: (error: unknown) => {
        this.pending.set(false);
        this.sounds.play('error');
        this.notifyError(
          '⚠️',
          'Ação não permitida',
          error instanceof Error ? error.message : 'A ação não pôde ser concluída.',
        );
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
      this.playStateSound(previous, updated);
      this.announceSkills(previous, updated);
      this.announcePuzzleResults(previous, updated);
      this.announceRoundWinners(previous, updated);
    }
    this.announceTurn(previous, updated);
    this.syncAutoReady(updated);
  }

  private playStateSound(previous: GameState, updated: GameState): void {
    if (updated.stateVersion <= previous.stateVersion) return;

    const turnChanged =
      updated.phase === 'EM_ANDAMENTO' &&
      updated.currentPlayerId !== null &&
      (previous.phase !== 'EM_ANDAMENTO' || updated.currentPlayerId !== previous.currentPlayerId);
    if (turnChanged) this.showTurnRim();

    const surprise = updated.plays.find(
      (play) =>
        play.card.skill === 'SURPRISE' &&
        typeof play.surpriseRoll === 'number' &&
        (updated.roundNumber !== previous.roundNumber || !previous.plays.some((old) => old.order === play.order)),
    );
    const buy = updated.plays.find(
      (play) =>
        play.card.skill === 'BUY' &&
        (updated.roundNumber !== previous.roundNumber || !previous.plays.some((old) => old.order === play.order)),
    );
    const theft = updated.plays.find(
      (play) =>
        play.card.skill === 'THEFT' &&
        !!play.theftKind &&
        (updated.roundNumber !== previous.roundNumber || !previous.plays.some((old) => old.order === play.order)),
    );
    const puzzleOpened = updated.plays.find(
      (play) =>
        play.card.skill === 'PUZZLE' &&
        (updated.roundNumber !== previous.roundNumber || !previous.plays.some((old) => old.order === play.order)),
    );
    const puzzleResolved = this.resolvedPuzzles(previous, updated)[0];

    let effect: MatchSound | null = null;
    if (updated.phase === 'FINALIZADO' && previous.phase !== 'FINALIZADO') {
      effect = this.didIWin(updated) ? 'victory' : 'round';
    } else if (updated.phase === 'CANCELADO' && previous.phase !== 'CANCELADO') {
      effect = 'cancel';
    } else if (updated.players.some((player) => player.trophies > (previous.players.find((old) => old.id === player.id)?.trophies ?? 0))) {
      effect = 'trophy';
    } else if ((updated.roundWinners?.length ?? 0) > (previous.roundWinners?.length ?? 0)) {
      effect = 'round';
    } else if (!previous.pendingPuzzle && updated.pendingPuzzle) {
      effect = 'puzzle';
    } else if (previous.pendingPuzzle && !updated.pendingPuzzle) {
      effect = 'answer';
    } else if (updated.plays.some((play) => play.card.skill && !previous.plays.some((old) => old.order === play.order && previous.roundNumber === updated.roundNumber))) {
      effect = 'skill';
    } else if (updated.plays.length > previous.plays.length && updated.roundNumber === previous.roundNumber) {
      effect = 'card';
    } else if (updated.players.some((player) => player.ready && !previous.players.find((old) => old.id === player.id)?.ready)) {
      effect = 'ready';
    }

    if (surprise) this.sounds.playSurprise(SURPRISE_POWER[surprise.card.naipe], (surprise.surpriseRoll ?? 0) > 0);
    if (buy) this.sounds.playBuy(BUY_POWER[buy.card.naipe], buy.buyCardsDrawn ?? BUY_POWER[buy.card.naipe], surprise ? 0.55 : 0);
    if (theft) {
      this.sounds.playTheft(THEFT_POWER[theft.card.naipe], theft.theftKind === 'COIN', theft.theftAmount ?? 0, !!theft.theftBlocked, surprise || buy ? 0.55 : 0);
    }
    // Abertura e resposta do puzzle substituem os sons genéricos 'puzzle', 'answer' e 'skill'.
    if (puzzleOpened && !puzzleResolved) this.sounds.playPuzzle(PUZZLE_POWER[puzzleOpened.card.naipe], surprise || buy ? 0.55 : 0);
    if (puzzleResolved) {
      this.sounds.playPuzzleResult(PUZZLE_POWER[puzzleResolved.card.naipe], !!puzzleResolved.puzzleCorrect, surprise || buy ? 0.55 : 0);
    }
    const puzzleSound = !!puzzleOpened || !!puzzleResolved;
    const specialSkill = !!surprise || !!buy || !!theft || puzzleSound;
    const replaced = effect === 'skill' || (puzzleSound && (effect === 'puzzle' || effect === 'answer'));
    if (effect && (!specialSkill || !replaced)) this.sounds.play(effect, specialSkill ? 0.7 : 0);
    if (turnChanged) this.sounds.play('turn', specialSkill ? 1 : effect ? 0.22 : 0);
  }

  private showTurnRim(): void {
    clearTimeout(this.turnRimTimer);
    this.turnEffects.set([++this.nextTurnEffectId]);
    this.turnRimTimer = setTimeout(() => this.turnEffects.set([]), TURN_RIM_DURATION);
  }

  /** Entre rodadas, marca "pronto" sozinho se o jogador não apertar a tempo. */
  private syncAutoReady(game: GameState): void {
    const waiting = game.phase === 'ENTRE_RODADAS' && !!this.myPlayer(game) && !this.isCurrentPlayerReady(game);
    if (!waiting) {
      this.stopAutoReady();
      return;
    }
    if (this.autoReadyTimer) return;

    this.autoReadyIn.set(AUTO_READY_SECONDS);
    this.autoReadyTimer = setInterval(() => {
      const left = (this.autoReadyIn() ?? 1) - 1;
      if (left > 0) {
        this.autoReadyIn.set(left);
        return;
      }
      // Outra ação em andamento: tenta de novo no próximo segundo.
      if (this.pending()) return;
      this.readyForNextRound();
    }, 1000);
  }

  private stopAutoReady(): void {
    clearInterval(this.autoReadyTimer);
    this.autoReadyTimer = undefined;
    this.autoReadyIn.set(null);
  }

  private announceSkills(previous: GameState, updated: GameState): void {
    const seen = new Set(previous.roundNumber === updated.roundNumber ? previous.plays.map((play) => play.order) : []);

    for (const play of updated.plays) {
      if (seen.has(play.order) || !play.card.skill) continue;
      const definition = this.skillFor(play.card);
      const surpriseRoll = play.card.skill === 'SURPRISE' ? play.surpriseRoll : null;
      const surpriseChange = play.surpriseCoinDelta ?? surpriseRoll ?? 0;
      const coinCount = Math.abs(surpriseChange);
      const coinLabel = `${coinCount} ${coinCount === 1 ? 'moeda' : 'moedas'}`;
      const surpriseResult = surpriseRoll !== null && surpriseRoll !== undefined
        ? surpriseRoll > 0
          ? `Ganhou ${coinLabel}`
          : surpriseChange < 0
            ? `Perdeu ${coinLabel}`
            : 'Sem moedas para perder'
        : null;
      const surpriseDetail = surpriseResult
        ? `${surpriseResult} · ${play.card.naipe.toLowerCase()} (força ${SURPRISE_POWER[play.card.naipe]})`
        : null;
      const buyCardsDrawn = play.card.skill === 'BUY' ? play.buyCardsDrawn : null;
      const buyDetail = buyCardsDrawn !== null && buyCardsDrawn !== undefined
        ? `${buyCardsDrawn > 0 ? `O próximo jogador comprou ${buyCardsDrawn} ${buyCardsDrawn === 1 ? 'carta' : 'cartas'}` : 'Nenhuma carta comprada'} · força ${BUY_POWER[play.card.naipe]}`
        : null;
      const theftPower = THEFT_POWER[play.card.naipe];
      const theftAmount = play.theftAmount ?? 0;
      const theftLoot = play.theftKind === 'COIN'
        ? `${theftAmount} ${theftAmount === 1 ? 'moeda' : 'moedas'}`
        : `${theftAmount} ${theftAmount === 1 ? 'carta' : 'cartas'}`;
      const theftDetail = play.card.skill === 'THEFT' && play.theftKind
        ? `${play.theftBlocked ? 'O escudo bloqueou o roubo' : theftAmount > 0 ? `Levou ${theftLoot}` : `Nada para levar (${play.theftKind === 'COIN' ? 'moedas' : 'cartas'})`} · força ${theftPower}`
        : null;
      const puzzlePower = PUZZLE_POWER[play.card.naipe];
      const puzzleDetail = play.card.skill === 'PUZZLE'
        ? `Acerto ganha ${puzzlePower} ${puzzlePower === 1 ? 'moeda' : 'moedas'}; erro compra ${puzzlePower} ${puzzlePower === 1 ? 'carta' : 'cartas'} · força ${puzzlePower}`
        : null;
      this.pushNotice({
        kind: 'skill',
        icon: '',
        iconAsset: skillIconAsset(play.card.skill, {
          surpriseRoll,
          direction: this.game() ? this.directionAfterPlay(this.game()!, play) : null,
        }),
        title: surpriseResult
          ? `${this.displayName(play.nickname)} teve uma surpresa ${typeof surpriseRoll === 'number' && surpriseRoll > 0 ? 'boa' : 'ruim'}!`
          : buyDetail
            ? `${this.displayName(play.nickname)} usou Compra!`
          : theftDetail
            ? `${this.displayName(play.nickname)} roubou ${play.theftKind === 'COIN' ? 'moedas' : 'cartas'}!`
          : `${this.displayName(play.nickname)} usou ${definition?.name ?? SKILL_LABEL[play.card.skill]}`,
        detail: surpriseDetail ?? buyDetail ?? theftDetail ?? puzzleDetail ?? definition?.description ?? `Carta ${this.cardName(play.card)}`,
      });
      this.pushBurst(play.card.skill, play);
    }
  }

  /** Puzzles respondidos desde o último estado (inclui abertura e resposta no mesmo poll). */
  private resolvedPuzzles(previous: GameState, updated: GameState): GamePlay[] {
    const sameRound = previous.roundNumber === updated.roundNumber;
    return updated.plays.filter(
      (play) =>
        play.card.skill === 'PUZZLE' &&
        typeof play.puzzleCorrect === 'boolean' &&
        (!sameRound || typeof previous.plays.find((old) => old.order === play.order)?.puzzleCorrect !== 'boolean'),
    );
  }

  private announcePuzzleResults(previous: GameState, updated: GameState): void {
    for (const play of this.resolvedPuzzles(previous, updated)) {
      const power = PUZZLE_POWER[play.card.naipe];
      const amount = play.puzzleAmount ?? power;
      const correct = !!play.puzzleCorrect;
      this.pushNotice({
        kind: 'skill',
        icon: correct ? '✅' : '❌',
        title: `${this.displayName(play.nickname)} ${correct ? 'acertou' : 'errou'} o puzzle!`,
        detail: correct
          ? `Ganhou ${amount} ${amount === 1 ? 'moeda' : 'moedas'} · força ${power}`
          : `${amount > 0 ? `Pagou a prenda: comprou ${amount} ${amount === 1 ? 'carta' : 'cartas'}` : 'Sem cartas para comprar'} · força ${power}`,
      });
      this.pushBurst('PUZZLE', play, true);
    }
  }

  private pushBurst(type: SkillType, play: GamePlay, puzzleResult = false): void {
    if (this.skillBursts().length >= MAX_BURSTS) return;
    const id = ++this.nextBurstId;
    // Habilidades do mesmo poll entram escalonadas; o tempo de vida cobre o atraso.
    const delay = this.skillBursts().length * BURST_STAGGER;
    const power =
      type === 'SURPRISE' ? SURPRISE_POWER[play.card.naipe]
      : type === 'BUY' ? BUY_POWER[play.card.naipe]
      : type === 'PUZZLE' ? PUZZLE_POWER[play.card.naipe]
      : type === 'THEFT' ? THEFT_POWER[play.card.naipe]
      : 1;
    const duration =
      type === 'SURPRISE' ? 1500 + power * 240
      : type === 'BUY' ? 1500 + power * 230
      : type === 'PUZZLE' ? 1400 + power * 250
      : type === 'THEFT' ? 1500 + power * 260
      : BURST_DURATION;
    this.skillBursts.update((list) => [...list, {
      id, type, delay, duration, power,
      direction: this.game() ? this.directionAfterPlay(this.game()!, play) : null,
      roll: type === 'SURPRISE' ? (play.surpriseRoll ?? null) : null,
      coinDelta: type === 'SURPRISE' ? (play.surpriseCoinDelta ?? null) : null,
      cardsDrawn: type === 'BUY' ? (play.buyCardsDrawn ?? null) : null,
      puzzleCorrect: puzzleResult ? !!play.puzzleCorrect : null,
      puzzleAmount: puzzleResult ? (play.puzzleAmount ?? null) : null,
      theftKind: type === 'THEFT' ? (play.theftKind ?? null) : null,
      theftAmount: type === 'THEFT' ? (play.theftAmount ?? null) : null,
      theftBlocked: type === 'THEFT' && !!play.theftBlocked,
    }]);
    this.burstTimers.set(
      id,
      setTimeout(() => {
        this.burstTimers.delete(id);
        this.skillBursts.update((list) => list.filter((burst) => burst.id !== id));
      }, duration + delay),
    );
  }

  /** Um aviso de erro por vez: o novo substitui o anterior. */
  private notifyError(icon: string, title: string, detail: string): void {
    this.notices()
      .filter((notice) => notice.kind === 'error')
      .forEach((notice) => this.dismissNotice(notice.id));
    this.pushNotice({ kind: 'error', icon, title, detail });
  }

  private announceRoundWinners(previous: GameState, updated: GameState): void {
    const lastSeen = Math.max(0, ...(previous.roundWinners ?? []).map((round) => round.roundNumber));

    // Se mais de uma rodada fechou entre duas atualizações, anuncia só a mais recente.
    const round = (updated.roundWinners ?? [])
      .filter((winner) => winner.roundNumber > lastSeen)
      .reduce<RoundWinner | null>(
        (latest, winner) => (!latest || winner.roundNumber > latest.roundNumber ? winner : latest),
        null,
      );
    if (!round) return;

    // O ganho vem da diferença no placar do vencedor; sem diferença visível, usa a regra da partida.
    const before = previous.players.find((player) => player.id === round.playerId);
    const after = updated.players.find((player) => player.id === round.playerId);
    const coinDiff = before && after ? after.matchCoins - before.matchCoins : 0;
    const trophyDiff = before && after ? after.trophies - before.trophies : 0;

    this.showRoundBanner({
      roundNumber: round.roundNumber,
      nickname: round.nickname,
      isMe: !!round.nickname && round.nickname === this.myNickname(),
      coins: round.nickname ? (coinDiff > 0 ? coinDiff : updated.settings.roundReward) : 0,
      trophies: Math.max(0, trophyDiff),
    });
  }

  private showRoundBanner(result: RoundResult): void {
    clearTimeout(this.roundBannerTimer);
    this.roundBanner.set(result);
    this.roundBannerTimer = setTimeout(() => this.dismissRoundBanner(), ROUND_BANNER_DURATION);
  }

  public dismissRoundBanner(): void {
    clearTimeout(this.roundBannerTimer);
    this.roundBannerTimer = undefined;
    this.roundBanner.set(null);
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

  private myPlayer(game: GameState): GamePlayer | undefined {
    const nickname = this.myNickname();
    return nickname ? game.players.find((player) => player.nickname === nickname) : undefined;
  }

  private myNickname(): string | undefined {
    return this.authSession.session()?.user.nickname;
  }
}
