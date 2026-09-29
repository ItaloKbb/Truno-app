# Histórico (`/perfil/historico`)

A rota já existe. O HTML descreve vitória contra `@ana` e derrota contra `@pedro` como texto fixo. Passe a usar `ProfileService.getActivities()`.

## Qual service

`getActivities()` devolve `MatchActivity[]`.

Cada item tem `id`, `result` (`VITORIA` ou `DERROTA`), `opponentName` e `playedAt`. `playedAt` é uma data em texto ISO, por exemplo `2026-09-28T18:00:00.000Z`. Não fatie essa string na mão. Use o `DatePipe`.

Não há filtro na API. Se quiser só vitórias, filtre o array na tela depois que ele chegar.

## A classe

```ts
import { AsyncPipe, DatePipe } from '@angular/common';

protected readonly activities$ =
  this.section === 'historico'
    ? this.profileApi.getActivities().pipe(
        catchError((error: unknown) => {
          this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar o histórico.');
          return of(null);
        }),
      )
    : of([]);
```

Coloque `DatePipe` ao lado de `AsyncPipe` em `imports`.

## O template

Dentro de `@if (section === 'historico')`:

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (activities$ | async; as activities) {
  <div class="settings">
    @for (activity of activities; track activity.id) {
      <article>
        <strong>
          {{ activity.result === 'VITORIA' ? 'Vitória' : 'Derrota' }}
          contra &#64;{{ activity.opponentName }}
        </strong>
        <p>{{ activity.playedAt | date: 'dd/MM/yyyy HH:mm' }}</p>
      </article>
    } @empty {
      <p>Nenhuma partida registrada. Jogue a primeira para ver o histórico.</p>
    }
  </div>
} @else {
  <p>Carregando o histórico...</p>
}
```

`&#64;` é como o template do Angular escreve um `@` literal. Sem isso, `@ana` é lido como bloco de controle.

O `@empty` é a conta sem partidas. Não reuse a frase de erro. "Falha ao carregar o histórico." só aparece quando o observable falha.

## Confira

`/perfil/historico` mostra a vitória contra `@ana` e a derrota contra `@pedro`, com data formatada. A ordem é a ordem do array da API. Não reordene no service. Se a tela precisar da mais recente primeiro, ordene uma cópia no componente com `[...activities].sort(...)`.
