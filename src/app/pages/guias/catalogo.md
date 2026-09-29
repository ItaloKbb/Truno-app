# Catálogo de cartas (`/book`)

Esta tela já usa o `CardService`. Ela é o modelo de **leitura**. Loja, habilidades, perguntas, coleção, conquistas e histórico repetem a mesma forma. Muda o service, o método e os campos desenhados.

A pasta é `src/app/pages/book`. A rota `/book` já tem `authGuard`.

## Qual service

`CardService`.

| Método | Quando a tela chama | Retorno |
| --- | --- | --- |
| `getAll()` | Ao abrir o catálogo | `Observable<Card[]>` |
| `getById(id)` | Se você abrir o detalhe de uma carta | `Observable<Card>` |

Cada `Card` tem, entre outros, `id`, `naipe`, `valor`, `url` e `trucoStrength`. A imagem da carta é `url`. O texto alternativo usa `valor` e `naipe`.

Não importe `mockCards`. O mock alimenta a API e os testes. A tela só enxerga o service.

## A classe

`src/app/pages/book/book.ts`:

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CardService } from '../../services/card.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-book',
  templateUrl: './book.html',
})
export class Book {
  protected readonly loadError = signal('');
  protected readonly cards$ = inject(CardService)
    .getAll()
    .pipe(
      catchError((error: unknown) => {
        this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as cartas.');
        return of(null);
      }),
    );
}
```

O que cada peça faz:

- `inject(CardService)` pede a instância única do service. Não use `new CardService()`.
- `getAll()` devolve um `Observable`. A requisição ainda não saiu.
- O `AsyncPipe`, no HTML, é quem se inscreve. Aí o `HttpClient` chama `GET /api/cards`.
- Se o guard `isCard` recusar o JSON, ou se a rede falhar, o service emite um `Error` com "Falha ao carregar as cartas."
- O `catchError` da tela guarda essa frase e devolve `null`, para o carregamento terminar.

## O template

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (cards$ | async; as cards) {
  <section>
    @for (card of cards; track card.id) {
      <img [src]="card.url" [alt]="card.valor + ' de ' + card.naipe.toLowerCase()" />
    } @empty {
      <p>Nenhuma carta encontrada.</p>
    }
  </section>
} @else {
  <p>Carregando cartas...</p>
}
```

A ordem do `@if` é a aula inteira:

1. Se existe `loadError`, mostre o alerta e não mostre a grade.
2. Senão, se o observable já emitiu um array, desenhe as cartas. Array vazio é verdade no `@if` e cai no `@empty`.
3. Senão, ainda está carregando. `AsyncPipe` entrega `null` enquanto espera.

`track card.id` evita recriar o DOM quando a lista atualiza.

## Detalhe de uma carta

Se a rota for `/book/:id`, leia o parâmetro e chame `getById`:

```ts
private readonly route = inject(ActivatedRoute);

protected readonly card$ = this.route.paramMap.pipe(
  switchMap((params) => this.cards.getById(params.get('id') ?? '')),
  catchError((error: unknown) => {
    this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar a carta.');
    return of(null);
  }),
);
```

Importe `switchMap` de `rxjs`. Trocar de carta cancela a requisição anterior. Um id desconhecido responde `404` e a tela mostra "Falha ao carregar a carta."

## Teste da tela

O teste não liga o servidor. Ele responde no lugar da API:

```ts
fixture.detectChanges();
http.expectOne('/api/cards').flush([
  /* uma carta completa, com id, naipe, valor, url e trucoStrength */
]);
fixture.detectChanges();
```

`detectChanges()` antes do `flush` faz o `AsyncPipe` assinar. O segundo `detectChanges()` desenha as imagens. O corpo do `flush` precisa passar em `isCard`. Carta sem `trucoStrength` é erro de resposta, não uma carta.

O arquivo `book.spec.ts` já faz esse teste com as duas primeiras cartas do baralho.
