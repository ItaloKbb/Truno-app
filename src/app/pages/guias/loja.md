# Loja (`/loja`)

A loja ainda não tem pasta. Você cria a tela e ela lê um único objeto no `ShopService`, não uma lista de lojas.

## Qual service

`ShopService.get()` devolve `Observable<Shop>`.

A loja tem `id`, `name`, `status`, `url` e `itens`. Cada item tem `id`, `name`, `price`, `url`, `trophyPrice` e `power` (`bomb` ou `block`).

`trophyPrice === true` significa que o preço é em troféus. `false` significa moedas. A tela explica isso. Não invente outro campo.

Não existe `getAll()` nem `create()`. A loja do Truno é uma só.

## Criar a tela

```bash
npm run ng -- generate component pages/loja
```

Em `src/app/app.routes.ts`, antes da rota `**`:

```ts
{
  path: 'loja',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/loja/loja').then((module) => module.Loja),
},
```

A classe gerada chama `Loja` e o seletor é `app-loja`. Mantenha os dois.

## A classe

A diferença para o catálogo: o valor emitido é um objeto, não um array. Não use `@for` na loja inteira. Use `@for` só em `shop.itens`.

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ShopService } from '../../services/shop.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-loja',
  templateUrl: './loja.html',
})
export class Loja {
  protected readonly loadError = signal('');
  protected readonly shop$ = inject(ShopService)
    .get()
    .pipe(
      catchError((error: unknown) => {
        this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar a loja.');
        return of(null);
      }),
    );
}
```

## O template

```html
<main>
  @if (loadError(); as message) {
    <p role="alert">{{ message }}</p>
  } @else if (shop$ | async; as shop) {
    <h1>{{ shop.name }}</h1>
    <p>{{ shop.status ? 'Aberta' : 'Fechada' }}</p>

    @if (!shop.status) {
      <p>A loja está fechada. Os itens continuam visíveis, mas o botão de compra fica desligado.</p>
    }

    <ul>
      @for (item of shop.itens; track item.id) {
        <li>
          <img [src]="item.url" [alt]="item.name" />
          <strong>{{ item.name }}</strong>
          <span>{{ item.power }}</span>
          <span>
            {{ item.price }}
            {{ item.trophyPrice ? 'troféus' : 'moedas' }}
          </span>
          <button type="button" [disabled]="!shop.status">Comprar</button>
        </li>
      } @empty {
        <li>Nenhum item à venda.</li>
      }
    </ul>
  } @else {
    <p>Carregando a loja...</p>
  }
</main>
```

O botão Comprar, neste guia, não chama API. Não há endpoint de compra. Deixe o botão desabilitado quando `shop.status` for falso e não finja um `POST`.

Se `get()` falhar, a frase do service é "Falha ao carregar a loja." Ela aparece no `role="alert"`. Não desenhe uma loja com zero itens nesse caso.

## Teste

```ts
fixture.detectChanges();
http.expectOne('/api/shop').flush({
  id: '1',
  name: 'Truno Shop',
  status: true,
  url: '/loja.png',
  itens: [
    { id: '1', name: 'Bomb', price: 100, url: '/bomb.png', trophyPrice: true, power: 'bomb' },
  ],
});
await fixture.whenStable();
fixture.detectChanges();
```

Confira o texto "Truno Shop" e "100 troféus". O `flush` precisa dos campos que `isShop` exige: `id`, `name`, `status` booleano, `url` e `itens` array.
