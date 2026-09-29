# Loja (`/loja`)

Nesta atividade, você vai criar uma tela que lê um único objeto `Shop` e percorre a lista `shop.itens`.

## Objetivo

Registrar a rota, carregar a loja, mostrar seu estado e listar os itens disponíveis.

## Vocabulário da atividade

- **shop/store** (loja): recurso único que contém itens.
- **nested list** (lista aninhada): array que existe dentro de outro objeto.
- **status** (estado): neste caso, informa se a loja está aberta.
- **disabled state** (estado desabilitado): controle visível que não aceita interação.

## Passo 1 — gerar e registrar

```bash
npm run ng -- generate component pages/loja
```

Adicione antes da rota `**`:

```ts
{
  path: 'loja',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/loja/loja').then((module) => module.Loja),
},
```

## Passo 2 — carregar o objeto

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ShopService } from '../../services/modules/shop.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-loja',
  templateUrl: './loja.html',
})
export class Loja {
  protected readonly loadError = signal('');
  protected readonly shop$ = inject(ShopService).get().pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar a loja.');
      return of(null);
    }),
  );
}
```

O serviço oferece `get()`, não `getAll()`, porque existe uma loja. A lista está dentro dela.

## Passo 3 — montar o template

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (shop$ | async; as shop) {
  <h1>{{ shop.name }}</h1>
  <p>{{ shop.status ? 'Aberta' : 'Fechada' }}</p>

  <ul>
    @for (item of shop.itens; track item.id) {
      <li>
        <img [src]="item.url" [alt]="item.name" />
        <strong>{{ item.name }}</strong>
        <span>{{ item.price }} {{ item.trophyPrice ? 'troféus' : 'moedas' }}</span>
        <button type="button" [disabled]="!shop.status">Comprar</button>
      </li>
    } @empty {
      <li>Nenhum item à venda.</li>
    }
  </ul>
} @else {
  <p>Carregando a loja...</p>
}
```

O botão Comprar é apenas visual enquanto não existir endpoint de compra. Não simule sucesso nem altere saldo localmente.

## Passo 4 — testar

```ts
fixture.detectChanges();
http.expectOne('/api/shop').flush({
  id: '1',
  name: 'Truno Shop',
  status: true,
  url: '/loja.png',
  itens: [],
});
fixture.detectChanges();
```

## Erros comuns

- Usar `@for` em `shop`; ele é um objeto, não um array.
- Habilitar compra sem contrato de API.
- Transformar falha de rede em uma loja vazia.
