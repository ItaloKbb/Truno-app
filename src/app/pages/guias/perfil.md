# Perfil (`/perfil`)

Nesta atividade, você vai substituir números fixos da visão geral por dados do `ProfileService`.

## Objetivo

Carregar perfil, estatísticas, coleção, conquistas e atividades como uma única visão consistente.

## Vocabulário da atividade

- **profile overview** (visão geral do perfil): resumo de várias fontes de dados.
- **parallel requests** (requisições paralelas): chamadas iniciadas sem esperar uma pela outra.
- **forkJoin** (junção): operador RxJS que espera todos os fluxos terminarem.
- **aggregate** (agregado): objeto formado pela combinação de vários resultados.
- **consistent state** (estado consistente): dados que pertencem à mesma carga, sem misturar valores antigos e novos.

## Passo 1 — entender os serviços

`ProfileService` busca dados remotos. `ProfileStorage` mantém apenas o rascunho local usado por partes da interface. Para estatísticas e histórico, use o serviço remoto.

| Método | Informação |
| --- | --- |
| `getProfile()` | Identidade, nível, experiência e moedas. |
| `getStats()` | Partidas, vitórias e sequência. |
| `getCollection()` | Cartas obtidas. |
| `getAchievements()` | Conquistas. |
| `getActivities()` | Atividades recentes. |

## Passo 2 — combinar as requisições

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Avatar } from '../../components/avatar/avatar';
import type { CollectionCard } from '../../domain/profile';
import { ProfileService } from '../../services/modules/profile.service';

@Component({
  imports: [AsyncPipe, RouterLink, Avatar],
  selector: 'app-profile',
  styleUrl: './profile.css',
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

  protected obtainedCount(cards: CollectionCard[]): number {
    return cards.filter((card) => card.obtained).length;
  }
}
```

`forkJoin` é adequado porque chamadas HTTP emitem uma resposta e terminam. Se uma falhar, o agregado inteiro falha; isso evita mostrar dados incompletos como se fossem uma visão confiável.

## Passo 3 — proteger o layout com os estados

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (overview$ | async; as overview) {
  <h1>{{ overview.profile.displayName }}</h1>
  <p>&#64;{{ overview.profile.username }}</p>
  <p>Nível {{ overview.profile.level }}</p>
  <p>{{ overview.profile.experience }} / {{ overview.profile.experienceToNextLevel }} XP</p>

  <p>{{ overview.stats.matchesPlayed }} partidas</p>
  <p>{{ overview.stats.wins }} vitórias</p>
  <p>{{ overview.stats.winRate * 100 }}% de aproveitamento</p>

  <p>
    {{ obtainedCount(overview.collection) }} de
    {{ overview.collection.length }} cartas obtidas
  </p>
} @else {
  <p>Carregando perfil...</p>
}
```

`winRate` é uma fração: `0.625` corresponde a `62.5%`. A multiplicação pertence à apresentação, não ao serviço.

## Passo 4 — renderizar listas internas

```html
@for (achievement of overview.achievements.slice(0, 3); track achievement.id) {
  <article>
    <strong>{{ achievement.title }}</strong>
    <p>{{ achievement.description }}</p>
  </article>
} @empty {
  <p>Nenhuma conquista ainda.</p>
}
```

`slice(0, 3)` devolve uma cópia com no máximo três itens. Isso é **client-side presentation** (apresentação no cliente), pois a API já entregou a lista.

## Checklist

- [ ] `AsyncPipe`, `RouterLink` e `Avatar` permanecem em `imports`.
- [ ] Os números fixos foram removidos.
- [ ] O template só lê `overview` dentro do bloco em que ele existe.
- [ ] Lista vazia tem mensagem própria.
- [ ] Uma falha não deixa números antigos visíveis.
