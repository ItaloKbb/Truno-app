# Perfil (`/perfil`)

A visão geral já tem layout em `src/app/pages/profile`. Os números 128, 68% e 1.250 estão escritos no HTML. A tarefa de hoje é substituir esses números pelo que o `ProfileService` devolve. Não apague o menu, o avatar nem as classes CSS.

## Qual service

`ProfileService`. A visão geral precisa de mais de um método, porque cada bloco mora num endpoint:

| Método | Endpoint | Para que serve na tela |
| --- | --- | --- |
| `getProfile()` | `GET /api/profile` | Nome, usuário, nível, XP, moedas e gemas |
| `getStats()` | `GET /api/profile/stats` | Partidas, vitórias, taxa e sequência |
| `getCollection()` | `GET /api/profile/collection` | Quantas cartas foram obtidas |
| `getAchievements()` | `GET /api/profile/achievements` | Três conquistas recentes |
| `getActivities()` | `GET /api/profile/activities` | Partidas recentes |

`ProfileStorage` é outra coisa. Ele guarda o rascunho local (`displayName`, `username`, `avatarUrl`, `initials`, `level`). Não use o storage para partidas, coleção ou conquistas. Esses dados vêm do `ProfileService`.

## Uma inscrição para vários métodos

Se você criar cinco `AsyncPipe`, são cinco carregamentos independentes e cinco lugares para errar. `forkJoin` espera todos e entrega um objeto só.

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Avatar } from '../../components/avatar/avatar';
import { ProfileService } from '../../services/profile.service';

@Component({
  imports: [AsyncPipe, RouterLink, Avatar],
  selector: 'app-profile',
  templateUrl: './profile.html',
})
export class Profile {
  private readonly profiles = inject(ProfileService);

  protected readonly loadError = signal('');
  protected readonly overview$ = forkJoin({
    profile: this.profiles.getProfile(),
    stats: this.profiles.getStats(),
    collection: this.profiles.getCollection(),
    achievements: this.profiles.getAchievements(),
    activities: this.profiles.getActivities(),
  }).pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar o perfil.');
      return of(null);
    }),
  );
}
```

Se um dos cinco falhar, o `forkJoin` inteiro falha. A tela mostra um alerta e não mistura número novo com número antigo. É melhor do que exibir vitórias sem conseguir dizer de quem são.

O componente já importa `Avatar` e `RouterLink`. Mantenha os dois no array `imports`, junto com `AsyncPipe`.

## Onde mexer no HTML

Envolva o miolo em `@if (overview$ | async; as overview)`. Dentro, troque o texto fixo pelo campo. Exemplos do que substituir em `profile.html`:

```html
<h1>{{ overview.profile.displayName }}</h1>
<p>&#64;{{ overview.profile.username }}</p>
<p>Nível {{ overview.profile.level }}</p>
<p>{{ overview.profile.experience }} / {{ overview.profile.experienceToNextLevel }} XP</p>

<strong>{{ overview.stats.matchesPlayed }}</strong>
<strong>{{ overview.stats.wins }} vitórias</strong>
<strong>{{ overview.stats.winRate * 100 }}%</strong>
<strong>{{ overview.stats.currentWinStreak }}</strong>
```

`winRate` vem como fração. `0.625` na tela é `62.5%` se você multiplicar por 100.

Coleção, no card de progresso:

```html
<strong>
  {{ obtained(overview.collection) }}
  <span>de {{ overview.collection.length }} cartas</span>
</strong>
```

O método fica na classe. Conta é regra de apresentação pequena, e a lista já chegou:

```ts
protected obtained(cards: { obtained: boolean }[]): number {
  return cards.filter((card) => card.obtained).length;
}
```

Conquistas recentes: as que têm `unlockedAt`. Se não quiser filtrar, mostre as três primeiras.

```html
@for (achievement of overview.achievements.slice(0, 3); track achievement.id) {
  <article>
    <strong>{{ achievement.title }}</strong>
    <p>{{ achievement.description }}</p>
  </article>
} @empty {
  <p>Nenhuma conquista ainda. Jogue uma partida para começar.</p>
}
```

Atividade:

```html
@for (activity of overview.activities; track activity.id) {
  <article>
    <strong>{{ activity.result === 'VITORIA' ? 'Vitória' : 'Derrota' }} contra &#64;{{ activity.opponentName }}</strong>
  </article>
} @empty {
  <p>Nenhuma partida ainda.</p>
}
```

O `@empty` aqui é o estado vazio de verdade: a API respondeu e a lista tem zero itens. A conta nova vê esse texto, não um card sem número.

O carregamento e o erro ficam em volta de tudo:

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (overview$ | async; as overview) {
  <!-- o layout que já existe, com os campos acima -->
} @else {
  <p>Carregando perfil...</p>
}
```

## Confira

Logado, `/perfil` deixa de mostrar 128 partidas fixas. O serviço de estatística devolve 200 partidas, 125 vitórias e taxa 0,625. O nome do perfil da API é Lucas Martins. Se a coleção falhar, a página inteira mostra o alerta, não só o card da coleção.
