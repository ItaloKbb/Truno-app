# Conquistas (`/perfil/conquistas`)

A rota já existe e cai em `ProfileSection` com `section === 'conquistas'`. O HTML repete três títulos fixos. Troque isso por `ProfileService.getAchievements()`.

## Qual service

`getAchievements()` devolve `Achievement[]`.

Cada conquista tem `id`, `title`, `description`, `progress`, `goal`, `reward` e, se já foi desbloqueada, `unlockedAt`. Sem `unlockedAt`, ela ainda está em progresso. Não invente um booleano `unlocked`. A data é o sinal.

O progresso é `progress` de `goal`. Uma conquista 24/100 não está concluída, mesmo que o título apareça na lista.

## A classe

Mesma ideia da coleção: só busque nesta seção.

```ts
protected readonly achievements$ =
  this.section === 'conquistas'
    ? this.profileApi.getAchievements().pipe(
        catchError((error: unknown) => {
          this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as conquistas.');
          return of(null);
        }),
      )
    : of([]);
```

`profileApi`, `loadError` e `AsyncPipe` são os mesmos da coleção. Se as duas telas forem feitas no mesmo componente, um `loadError` serve para a seção aberta, porque só uma requisição dispara.

## O template

Substitua o `@for (achievement of ['Primeira lendária', ...])` por isto, dentro de `@if (section === 'conquistas')`:

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (achievements$ | async; as achievements) {
  <p>
    {{ unlocked(achievements) }} de {{ achievements.length }} desbloqueadas
  </p>
  <div class="achievement-grid">
    @for (achievement of achievements; track achievement.id) {
      <article>
        <strong>{{ achievement.title }}</strong>
        <p>{{ achievement.description }}</p>
        <small>{{ achievement.progress }}/{{ achievement.goal }}</small>
        <small>{{ achievement.reward }}</small>
        @if (achievement.unlockedAt) {
          <time>{{ achievement.unlockedAt }}</time>
        } @else {
          <small>Em progresso</small>
        }
      </article>
    } @empty {
      <p>Nenhuma conquista cadastrada.</p>
    }
  </div>
} @else {
  <p>Carregando conquistas...</p>
}
```

```ts
protected unlocked(achievements: { unlockedAt?: string }[]): number {
  return achievements.filter((achievement) => achievement.unlockedAt).length;
}
```

Destaque visual de "quase lá" também fica na tela: `achievement.progress / achievement.goal >= 0.8` e ainda sem `unlockedAt`. Não peça isso ao service.

## Confira

`/perfil/conquistas` lista Primeira lendária, Mestre estrategista e Colecionador. As duas primeiras têm data. Colecionador mostra 24/100 e "Em progresso". A mensagem de falha do service é "Falha ao carregar as conquistas."
