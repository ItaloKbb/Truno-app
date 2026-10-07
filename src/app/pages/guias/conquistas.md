# Conquistas (`/perfil/conquistas`)

Nesta atividade, você vai trocar os textos fixos da seção por `ProfileService.getAchievements()`.

## Objetivo

Exibir progresso, recompensa e situação de cada conquista, buscando os dados somente na rota de conquistas.

## Vocabulário da atividade

- **achievement** (conquista): objetivo que o jogador pode completar.
- **progress** (progresso): quantidade já alcançada.
- **goal** (meta): quantidade necessária para concluir.
- **unlocked** (desbloqueada): conquista concluída.
- **optional property** (propriedade opcional): campo que pode não existir, marcado com `?` no TypeScript.

## Passo 1 — conhecer o modelo

Cada `Achievement` possui `id`, `title`, `description`, `progress`, `goal`, `reward` e, quando concluída, `unlockedAt`.

Não crie um booleano `unlocked`. A presença de `unlockedAt` já representa esse estado.

## Passo 2 — criar o fluxo

Importe `Achievement`, injete o serviço e prepare a mensagem de erro:

```ts
import { AsyncPipe } from '@angular/common';
import type { Achievement } from '../../domain/profile';
import { ProfileService } from '../../services/modules/profile.service';

private readonly profileApi = inject(ProfileService);
protected readonly loadError = signal('');
```

Adicione `AsyncPipe` aos `imports` do componente. Em seguida, crie o fluxo:

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

protected unlockedCount(achievements: Achievement[]): number {
  return achievements.filter((achievement) => achievement.unlockedAt).length;
}
```

`filter` cria um novo array. O `.length` desse resultado fornece a contagem sem modificar os dados originais.

## Passo 3 — desenhar a seção

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (achievements$ | async; as achievements) {
  <p>{{ unlockedCount(achievements) }} de {{ achievements.length }} desbloqueadas</p>

  @for (achievement of achievements; track achievement.id) {
    <article>
      <h2>{{ achievement.title }}</h2>
      <p>{{ achievement.description }}</p>
      <p>{{ achievement.progress }} / {{ achievement.goal }}</p>
      <p>Recompensa: {{ achievement.reward }}</p>

      @if (achievement.unlockedAt) {
        <p>Desbloqueada</p>
      } @else {
        <p>Em progresso</p>
      }
    </article>
  } @empty {
    <p>Nenhuma conquista cadastrada.</p>
  }
} @else {
  <p>Carregando conquistas...</p>
}
```

`@if (achievement.unlockedAt)` faz **narrowing** (estreitamento de tipo): dentro do bloco, o Angular sabe que a data existe.

## Passo 4 — conferir

1. Abra `/perfil/conquistas` com sessão.
2. Confira título, progresso e recompensa.
3. Diferencie concluídas das que estão em progresso.
4. Simule uma lista vazia no teste.
5. Simule erro e confirme `role="alert"`.

## Erros comuns

- Considerar `progress > 0` como conclusão.
- Calcular progresso no serviço quando ele já vem da API.
- Usar o índice do array no `track`; prefira `achievement.id`.
