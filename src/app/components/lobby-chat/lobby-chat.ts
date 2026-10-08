import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, exhaustMap, tap, timer } from 'rxjs';
import { CHAT_MAX_LENGTH, splitMessage, type ChatMessage, type ChatSegment } from '../../domain/chat';
import { AuthSessionStore } from '../../services/modules/auth-session';
import { ChatService } from '../../services/modules/chat.service';

const POLL_INTERVAL = 3000;
const MAX_KEPT = 200;

interface ChatLine extends ChatMessage {
  segments: ChatSegment[];
  time: string;
  mine: boolean;
}

@Component({
  selector: 'app-lobby-chat',
  styleUrl: './lobby-chat.css',
  templateUrl: './lobby-chat.html',
})
export class LobbyChat implements OnInit {
  /** Código de partida clicado em uma mensagem. */
  @Output() join = new EventEmitter<string>();
  @ViewChild('log') private log?: ElementRef<HTMLElement>;

  private readonly chat = inject(ChatService);
  private readonly session = inject(AuthSessionStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly maxLength = CHAT_MAX_LENGTH;
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly loaded = signal(false);
  protected readonly error = signal('');

  protected readonly lines = computed<ChatLine[]>(() => {
    const myId = this.session.session()?.user.id;
    return this.messages().map((message) => ({
      ...message,
      segments: splitMessage(message.text),
      time: new Date(message.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      mine: message.authorId === myId,
    }));
  });

  ngOnInit(): void {
    if (!this.browser) return;

    timer(0, POLL_INTERVAL)
      .pipe(
        exhaustMap(() =>
          this.chat.list(this.lastId()).pipe(
            tap((incoming) => {
              this.merge(incoming);
              this.loaded.set(true);
              this.error.set('');
            }),
            catchError((error: unknown) => {
              this.error.set(error instanceof Error ? error.message : 'Chat indisponível.');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text || this.sending()) return;

    this.sending.set(true);
    this.chat.send(text).subscribe({
      next: (message) => {
        this.sending.set(false);
        this.draft.set('');
        this.error.set('');
        this.merge([message], true);
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.error.set(error instanceof Error ? error.message : 'Não foi possível enviar.');
      },
    });
  }

  private lastId(): number | undefined {
    const list = this.messages();
    return list.length ? list[list.length - 1].id : undefined;
  }

  /** Junta sem repetir ids e mantém a ordem; desce a lista se o jogador já estava no fim. */
  private merge(incoming: ChatMessage[], forceScroll = false): void {
    if (!incoming.length) return;

    const log = this.log?.nativeElement;
    const atBottom = !log || log.scrollHeight - log.scrollTop - log.clientHeight < 40;

    this.messages.update((list) => {
      const known = new Set(list.map((message) => message.id));
      const merged = [...list, ...incoming.filter((message) => !known.has(message.id))];
      merged.sort((a, b) => a.id - b.id);
      return merged.slice(-MAX_KEPT);
    });

    if (log && (atBottom || forceScroll)) {
      requestAnimationFrame(() => (log.scrollTop = log.scrollHeight));
    }
  }
}
