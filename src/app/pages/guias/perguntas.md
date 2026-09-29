# Perguntas (`/perguntas`)

Você cria esta tela. Ela mostra as perguntas de tutorial que o `PuzzleService` entrega. A pessoa escolhe uma alternativa e a tela compara com o índice correto. A comparação é da tela. O service só busca.

## Qual service

| Método | Uso |
| --- | --- |
| `getAll()` | Todas as perguntas |
| `getById(id)` | Uma pergunta, se a tela for passo a passo |

Cada `Puzzle` tem `id`, `title`, `alternativas` (array de strings) e `alternativaCorreta` (índice dentro desse array, começando em zero).

Não escreva as perguntas no HTML. Se a API mudar o texto, a tela acompanha.

## Criar e registrar

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

## A classe

Busque com `getAll()`, no mesmo `pipe` do catálogo. Guarde a resposta escolhida num `signal`. A chave é o `id` da pergunta.

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { PuzzleService } from '../../services/puzzle.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-perguntas',
  templateUrl: './perguntas.html',
})
export class Perguntas {
  protected readonly loadError = signal('');
  protected readonly answers = signal<Record<string, number>>({});
  protected readonly puzzles$ = inject(PuzzleService)
    .getAll()
    .pipe(
      catchError((error: unknown) => {
        this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as perguntas.');
        return of(null);
      }),
    );

  protected choose(puzzleId: string, index: number): void {
    this.answers.update((current) => ({ ...current, [puzzleId]: index }));
  }

  protected chosen(puzzleId: string): number | null {
    const index = this.answers()[puzzleId];
    return index === undefined ? null : index;
  }
}
```

`choose` não chama o service. A resposta certa já veio no objeto. Chamar a API de novo a cada clique não acrescenta nada.

## O template

Não mostre `alternativaCorreta` antes do clique. Depois do clique, diga se acertou.

```html
<main>
  <h1>Perguntas</h1>

  @if (loadError(); as message) {
    <p role="alert">{{ message }}</p>
  } @else if (puzzles$ | async; as puzzles) {
    @for (puzzle of puzzles; track puzzle.id) {
      <article>
        <h2>{{ puzzle.title }}</h2>
        @for (option of puzzle.alternativas; track option) {
          <button type="button" (click)="choose(puzzle.id, $index)" [disabled]="chosen(puzzle.id) !== null">
            {{ option }}
          </button>
        }
        @if (chosen(puzzle.id) !== null) {
          <p role="status">
            {{ chosen(puzzle.id) === puzzle.alternativaCorreta ? 'Resposta certa.' : 'Resposta errada.' }}
          </p>
        }
      </article>
    } @empty {
      <p>Nenhuma pergunta disponível.</p>
    }
  } @else {
    <p>Carregando perguntas...</p>
  }
</main>
```

`$index` é a posição da alternativa. É esse número que se compara com `alternativaCorreta`. A comparação no template usa `!== null` de propósito: a alternativa zero é uma resposta válida, e `@if (chosen(...); as picked)` trataria `0` como ausência.

O `@empty` fica no `@for` das perguntas, não no das alternativas. Uma pergunta sem alternativas é outro caso: o `@for` interno simplesmente não desenha botões.

`track option` funciona porque os textos do baralho de exemplo não se repetem dentro da mesma pergunta. Se duas alternativas tivessem o mesmo texto, use `track $index`.

## Confira

Abra `/perguntas` logado. A primeira pergunta da API é sobre a quantidade de naipes. Escolha uma alternativa e leia "Resposta certa." ou "Resposta errada." Recarregar a página zera o `signal`: ele não é persistido, e não deve ser. Não grave resposta em `localStorage` neste exercício.
