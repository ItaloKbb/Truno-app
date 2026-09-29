# Ranking (`/ranking`)

Nesta atividade, você vai completar a tela de classificação usando `RankingService`.

## Objetivo

Buscar jogadores ordenados pela API e mostrar posição, apelido e pontos.

## Vocabulário da atividade

- **ranking/leaderboard** (classificação): lista de participantes ordenada por desempenho.
- **ranking points** (pontos de ranking): pontuação usada na classificação.
- **position** (posição): lugar visual calculado pelo índice da lista.
- **read-only view** (visão somente leitura): tela que consulta dados sem alterá-los.

## Passo 1 — conhecer o serviço

`RankingService`, em `services/modules/ranking.service.ts`, oferece:

```ts
getAll(): Observable<RankingEntry[]>
```

Cada entrada tem `id`, `nickname` e `rankingPoints`. A API é responsável pela ordem; a tela apenas numera os itens.

## Passo 2 — carregar a lista

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { RankingService } from '../../services/modules/ranking.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-ranking',
  styleUrl: './ranking.css',
  templateUrl: './ranking.html',
})
export class Ranking {
  protected readonly loadError = signal('');
  protected readonly entries$ = inject(RankingService).getAll().pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar o ranking.');
      return of(null);
    }),
  );
}
```

## Passo 3 — montar uma lista ordenada

```html
<main>
  <h1>Ranking</h1>

  @if (loadError(); as message) {
    <p role="alert">{{ message }}</p>
  } @else if (entries$ | async; as entries) {
    <ol>
      @for (entry of entries; track entry.id) {
        <li>
          <span>{{ $index + 1 }}º</span>
          <strong>{{ entry.nickname }}</strong>
          <span>{{ entry.rankingPoints }} pontos</span>
        </li>
      } @empty {
        <li>Nenhum jogador classificado.</li>
      }
    </ol>
  } @else {
    <p>Carregando ranking...</p>
  }
</main>
```

`$index` começa em zero; por isso somamos 1 para a posição humana. O `track` continua usando o identificador real, não a posição.

## Passo 4 — conferir

1. Abra `/ranking` com sessão.
2. Confira se a primeira posição aparece como `1º`.
3. Simule lista vazia.
4. Simule erro da API.
5. Confirme que a tela não reordena silenciosamente o resultado.

## Erros comuns

- Usar `$index` como identidade do item.
- Chamar um método `getById()` que não existe.
- Confundir `rankingPoints` com moedas ou troféus da partida.
