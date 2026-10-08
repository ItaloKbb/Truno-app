/**
 * Contrato do chat do lobby (HTTP + polling).
 *
 * GET  `/chat/messages[?after=id]` → ChatMessage[] (sem `after`: as 50 últimas)
 * POST `/chat/messages` { text }   → 201 ChatMessage | 400 ou 409 { message }
 */
export interface ChatMessage {
  id: number;
  authorId: number;
  nickname: string;
  text: string;
  /** ISO-8601. */
  sentAt: string;
}

export const CHAT_MAX_LENGTH = 280;

/** Mesmo alfabeto do código gerado pelo backend (sem I, O, 0 e 1), isolado de outras letras. */
const GAME_CODE_PATTERN = /(?<![\p{L}\p{N}])[A-HJ-NP-Z2-9]{6}(?![\p{L}\p{N}])/gu;

export interface ChatSegment {
  kind: 'text' | 'code';
  value: string;
}

/** Quebra o texto em trechos; códigos de partida viram convites clicáveis. */
export function splitMessage(text: string): ChatSegment[] {
  const segments: ChatSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(GAME_CODE_PATTERN)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ kind: 'text', value: text.slice(last, start) });
    segments.push({ kind: 'code', value: match[0] });
    last = start + match[0].length;
  }
  if (last < text.length) segments.push({ kind: 'text', value: text.slice(last) });
  return segments;
}
