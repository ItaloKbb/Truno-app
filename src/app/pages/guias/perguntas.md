# Perguntas (`/perguntas`)

Nesta atividade, você vai criar um catálogo público de perguntas. A tela mostra enunciados e alternativas, mas nunca revela a resposta correta.

## Objetivo

Criar a rota, buscar as definições pelo `PuzzleService` e compreender a diferença entre consultar perguntas e responder um desafio de partida.

## Vocabulário da atividade

- **puzzle/challenge** (pergunta/desafio): atividade apresentada durante o jogo.
- **alternative** (alternativa): uma opção de resposta.
- **answer key** (gabarito): informação que indica a resposta correta.
- **server-side validation** (validação no servidor): decisão feita pela API, não pelo navegador.
- **information leak** (vazamento de informação): exposição de um dado que deveria permanecer secreto.

## Passo 1 — entender a regra de segurança

`PuzzleDefinition` possui `id`, `question` e `alternativas`. Não possui título nem índice correto.

O endpoint `GET /puzzles` nunca devolve o gabarito. Isso impede que alguém inspecione a rede e descubra a resposta antes de jogar.

## Passo 2 — criar e registrar

```bash
npm run ng -- generate component pages/perguntas
```

```ts
{
  path: 'perguntas',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/perguntas/perguntas').then((module) => module.Perguntas),
},
```

## Passo 3 — carregar o catálogo

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { PuzzleService } from '../../services/modules/puzzle.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-perguntas',
  templateUrl: './perguntas.html',
})
export class Perguntas {
  protected readonly loadError = signal('');
  protected readonly puzzles$ = inject(PuzzleService).getAll().pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as perguntas.');
      return of(null);
    }),
  );
}
```

## Passo 4 — mostrar sem corrigir

```html
<main>
  <h1>Perguntas</h1>

  @if (loadError(); as message) {
    <p role="alert">{{ message }}</p>
  } @else if (puzzles$ | async; as puzzles) {
    @for (puzzle of puzzles; track puzzle.id) {
      <article>
        <h2>{{ puzzle.question }}</h2>
        <ol>
          @for (alternative of puzzle.alternativas; track $index) {
            <li>{{ alternative }}</li>
          }
        </ol>
      </article>
    } @empty {
      <p>Nenhuma pergunta disponível.</p>
    }
  } @else {
    <p>Carregando perguntas...</p>
  }
</main>
```

Usamos `track $index` porque alternativas diferentes podem ter o mesmo texto. O índice é estável dentro daquela pergunta.

## Passo 5 — responder durante a partida

Quando uma partida tem `pendingPuzzle`, o clique envia:

```ts
games.answerPuzzle(gameId, pendingPuzzle.challengeId, alternativeIndex)
```

O servidor verifica a resposta e devolve o novo `GameState`. Não compare com um campo `alternativaCorreta`, pois esse campo não existe no contrato público.

## Checklist

- [ ] A tela usa `question`, não `title`.
- [ ] Nenhum gabarito é inventado no cliente.
- [ ] O catálogo só apresenta as alternativas.
- [ ] A resposta de uma partida passa por `GameService.answerPuzzle`.
