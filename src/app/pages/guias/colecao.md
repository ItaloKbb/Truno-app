# Coleção (`/perfil/colecao`)

A rota já abre `ProfileSection` com `data: { section: 'colecao' }`. As seis cartas estão escritas no TypeScript do componente. A tarefa é ler `ProfileService.getCollection()` e apagar esse array fixo.

## Qual service

Só este método: `getCollection()`. Ele devolve `CollectionCard[]`.

Cada carta da coleção tem `name`, `rarity`, `level` e `obtained`. Não tem `id`. No `@for`, use `track card.name`. Também não tem `url`: esta coleção não é o baralho de `CardService`. Não misture os dois services nesta tela. O catálogo de imagens fica em `/book`.

`rarity` é `Comum`, `Rara`, `Épica`, `Lendária` ou `Desconhecida`.

## Onde colocar o observable

`ProfileSection` atende várias rotas. A coleção só deve chamar `getCollection()` quando `section === 'colecao'`. Nas outras seções, não dispare essa requisição.

```ts
import { AsyncPipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import { ProfileService } from '../../services/profile.service';

private readonly profileApi = inject(ProfileService);
protected readonly loadError = signal('');

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

`this.section` já vem de `this.route.snapshot.data['section']`. É um valor fixo para aquela abertura da rota. O ternário evita a requisição nas conquistas e no histórico.

Inclua `AsyncPipe` nos `imports` do `@Component`.

Apague o array `cards` que lista Guardião da Floresta, Feiticeira Lunar e as outras. Se ele continuar, a tela mente: mostra um dado que não passou pelo service.

## O template

No bloco `@if (section === 'colecao')`, troque o `@for (card of filteredCards` pela lista que chegou.

O filtro por obtida, não obtida e busca continua na tela. A lista completa vem uma vez. Filtrar no service obrigaria um endpoint novo para cada clique.

```ts
protected visibleCollection(
  cards: { name: string; rarity: string; level: number; obtained: boolean }[],
): typeof cards {
  const filter = this.activeFilter();
  const term = this.searchTerm().trim().toLocaleLowerCase();
  return cards.filter((card) => {
    const matchesFilter = filter === 'all' || (filter === 'obtained' ? card.obtained : !card.obtained);
    const matchesName = !term || card.name.toLocaleLowerCase().includes(term);
    return matchesFilter && matchesName;
  });
}
```

```html
@if (section === 'colecao') {
  @if (loadError(); as message) {
    <p role="alert">{{ message }}</p>
  } @else if (collection$ | async; as cards) {
    <p>{{ obtainedCount(cards) }} de {{ cards.length }} cartas</p>
    <div class="filters">
      <button type="button" (click)="setFilter('all')">Todas</button>
      <button type="button" (click)="setFilter('obtained')">Obtidas</button>
      <button type="button" (click)="setFilter('missing')">Não obtidas</button>
      <input type="search" (input)="setSearchTerm($any($event.target).value)" placeholder="Buscar carta" />
    </div>
    <div class="cards">
      @for (card of visibleCollection(cards); track card.name) {
        <article>
          <strong>{{ card.obtained ? card.name : 'Carta desconhecida' }}</strong>
          <small>{{ card.rarity }}</small>
          @if (card.obtained) {
            <small>Nível {{ card.level }}</small>
          } @else {
            <small>Ainda não obtida</small>
          }
        </article>
      } @empty {
        <p>Nenhuma carta encontrada com esse filtro.</p>
      }
    </div>
  } @else {
    <p>Carregando a coleção...</p>
  }
}
```

Carta com `obtained: false` não revela o nome. A API manda o nome mesmo assim. Esconder é decisão da tela, para a coleção bloqueada não entregar a resposta de graça. O `@empty` do filtro é diferente de uma coleção que ainda está carregando.

`obtainedCount` é o mesmo filtro `card.obtained` usado no perfil.

## Confira

Em `/perfil/colecao`, logado, as cartas vêm de `GET /api/profile/collection`. Caçador Solar e Oráculo das Marés aparecem como "Carta desconhecida". Se você buscar "Dragão", só o Dragão Rubro permanece. Limpar a busca devolve a lista. A falha do endpoint mostra "Falha ao carregar a coleção." e não uma grade em branco.
