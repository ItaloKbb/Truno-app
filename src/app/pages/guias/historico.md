# Histórico (`/perfil/historico`)

Nesta atividade, você vai carregar as partidas recentes com `ProfileService.getActivities()` e formatar a data para leitura humana.

## Objetivo

Exibir resultado, adversário e data de cada atividade, sem manter textos fixos no HTML.

## Vocabulário da atividade

- **activity/history** (atividade/histórico): registro de algo que já aconteceu.
- **ISO date** (data ISO): texto padronizado como `2026-09-28T18:00:00.000Z`.
- **DatePipe** (pipe de data): formatador de datas do Angular.
- **locale** (localidade): regras regionais de idioma, data e números.

## Passo 1 — preparar os imports

```ts
import { AsyncPipe, DatePipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import { ProfileService } from '../../services/modules/profile.service';
```

Adicione os dois ao array `imports`. `AsyncPipe` lê o fluxo; `DatePipe` transforma a data no template.

Injete o serviço e prepare a mensagem de erro:

```ts
private readonly profileApi = inject(ProfileService);
protected readonly loadError = signal('');
```

## Passo 2 — criar o fluxo

```ts
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

Cada `MatchActivity` tem `id`, `result`, `opponentName` e `playedAt`. Não corte a string da data manualmente.

## Passo 3 — montar o template

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (activities$ | async; as activities) {
  @for (activity of activities; track activity.id) {
    <article>
      <strong>
        {{ activity.result === 'VITORIA' ? 'Vitória' : 'Derrota' }}
        contra &#64;{{ activity.opponentName }}
      </strong>
      <time [attr.datetime]="activity.playedAt">
        {{ activity.playedAt | date: 'dd/MM/yyyy HH:mm' }}
      </time>
    </article>
  } @empty {
    <p>Nenhuma partida registrada.</p>
  }
} @else {
  <p>Carregando o histórico...</p>
}
```

O elemento `<time>` melhora a semântica. `[attr.datetime]` mantém a data original para tecnologias assistivas. `&#64;` representa um `@` literal no template Angular.

## Passo 4 — ordenar somente se a tela exigir

Se o requisito for “mais recente primeiro”, ordene uma cópia:

```ts
return [...activities].sort(
  (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
);
```

O **spread operator** (`...`) cria uma cópia. Assim, o array recebido da API não é alterado.

## Checklist

- [ ] `DatePipe` está em `imports`.
- [ ] A data não é cortada com `substring` ou `split`.
- [ ] O estado vazio não é tratado como erro.
- [ ] A ordenação, se existir, não modifica o array original.
