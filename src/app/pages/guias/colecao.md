# Coleção (`/perfil/colecao`)

Nesta atividade, você vai substituir as cartas fixas de `ProfileSection` por dados de `ProfileService.getCollection()`.

## Objetivo

Buscar a coleção somente quando a seção aberta for `colecao`, manter os filtros locais e representar carregamento, vazio e erro.

## Vocabulário da atividade

- **collection** (coleção): conjunto de cartas do jogador.
- **filter** (filtro): regra local que escolhe quais itens aparecem.
- **derived data** (dado derivado): valor calculado a partir de outro, como a quantidade obtida.
- **ternary operator** (operador ternário): forma curta de escolher entre dois valores com `condição ? valorA : valorB`.

## Passo 1 — conhecer o modelo

`getCollection()` devolve `Observable<CollectionCard[]>`. Cada carta tem:

```ts
{ name, rarity, level, obtained }
```

Não há `id` nem `url`. Portanto, use `track card.name` e não misture esta coleção com o catálogo do `CardService`.

## Passo 2 — importar e injetar

```ts
import { AsyncPipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import type { CollectionCard } from '../../domain/profile';
import { ProfileService } from '../../services/modules/profile.service';

private readonly profileApi = inject(ProfileService);
protected readonly loadError = signal('');
```

Adicione `AsyncPipe` aos `imports` do componente.

## Passo 3 — buscar apenas nesta rota

```ts
protected readonly collection$ =
  this.section === 'colecao'
    ? this.profileApi.getCollection().pipe(
        catchError((error: unknown) => {
          this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar a coleção.');
          return of(null);
        }),
      )
    : of([]);
```

`ProfileSection` atende várias rotas. O operador ternário impede uma requisição de coleção ao abrir histórico ou configurações.

## Passo 4 — manter o filtro no componente

```ts
protected visibleCollection(cards: CollectionCard[]): CollectionCard[] {
  const filter = this.activeFilter();
  const term = this.searchTerm().trim().toLocaleLowerCase();

  return cards.filter((card) => {
    const matchesStatus =
      filter === 'all' || (filter === 'obtained' ? card.obtained : !card.obtained);
    const matchesName = !term || card.name.toLocaleLowerCase().includes(term);
    return matchesStatus && matchesName;
  });
}

protected obtainedCount(cards: CollectionCard[]): number {
  return cards.filter((card) => card.obtained).length;
}
```

O servidor entrega a coleção completa. Busca por texto e filtro são **presentation logic** (lógica de apresentação), por isso ficam na tela.

## Passo 5 — montar o template

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (collection$ | async; as cards) {
  <p>{{ obtainedCount(cards) }} de {{ cards.length }} cartas obtidas</p>

  @for (card of visibleCollection(cards); track card.name) {
    <article>
      <strong>{{ card.obtained ? card.name : 'Carta desconhecida' }}</strong>
      <span>{{ card.rarity }}</span>
      <span>{{ card.obtained ? 'Nível ' + card.level : 'Ainda não obtida' }}</span>
    </article>
  } @empty {
    <p>Nenhuma carta encontrada com este filtro.</p>
  }
} @else {
  <p>Carregando a coleção...</p>
}
```

Uma carta bloqueada não revela o nome. Essa é uma decisão visual; o objeto original não deve ser alterado.

## Checklist

- [ ] O array fixo foi removido.
- [ ] A requisição só ocorre na seção `colecao`.
- [ ] O filtro usa uma nova lista e não modifica a resposta.
- [ ] `track card.name` é usado.
- [ ] Falha e filtro sem resultados mostram mensagens diferentes.
