import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ChatMessage } from '../../domain/chat';
import { API_BASE_URL } from '../config/api-config';
import { expectList, expectOne, isChatMessage, readApi } from '../config/api-response';

/** Chat global do lobby. O token vai no `X-Player-Token` pelo interceptor. */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/chat/messages`;

  /** Sem `after`: as últimas mensagens. Com `after`: só as posteriores a esse id. */
  list(after?: number): Observable<ChatMessage[]> {
    const params: Record<string, number> = after === undefined ? {} : { after };
    return readApi(
      this.http.get<unknown>(this.apiUrl, { params }),
      (body) => expectList(body, isChatMessage),
      'Falha ao carregar o chat.',
    );
  }

  send(text: string): Observable<ChatMessage> {
    return readApi(
      this.http.post<unknown>(this.apiUrl, { text: text.trim() }),
      (body) => expectOne(body, isChatMessage),
      'Falha ao enviar a mensagem.',
    );
  }
}
