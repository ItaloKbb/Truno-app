/** Pergunta de tutorial ou intervalo entre partidas. */
export interface Puzzle {
  id: string;
  title: string;
  alternativas: string[];
  /** Índice da alternativa correta dentro de `alternativas`. */
  alternativaCorreta: number;
}
