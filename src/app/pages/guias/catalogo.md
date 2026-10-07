# Catálogo de cartas (`/book`)

Nesta atividade, você vai transformar a tela `Book` em uma leitura da API usando `CardService`.

## Objetivo

A tela deverá buscar as cartas, exibir a imagem correspondente e diferenciar carregamento, lista vazia e erro.

## Vocabulário da atividade

- **catalog** (catálogo): coleção de itens disponíveis para consulta.
- **fetch/load** (buscar/carregar): obter dados de uma fonte externa.
- **stream** (fluxo): sequência assíncrona representada por um `Observable`.
- **pipe** (encadeamento): sequência de operadores aplicada ao fluxo.
- **type guard** (guarda de tipo): função que confere o formato recebido em tempo de execução.
- **alternative text** (texto alternativo): descrição de uma imagem usada por leitores de tela.

## Passo 1 — conhecer o dado

O `CardService`, em `services/modules/card.service.ts`, oferece:

```ts
getAll(): Observable<CatalogCard[]>
getById(id: number): Observable<CatalogCard>
```

Cada `CatalogCard` tem `id`, `valor` e `naipe`. A API não devolve uma URL de imagem. O caminho correto é criado por `cardAsset(valor, naipe)`.

## Passo 2 — preparar a classe

Em `src/app/pages/book/book.ts`:

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { cardAsset, cardLabel, type CatalogCard } from '../../domain/truno-api';
import { CardService } from '../../services/modules/card.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-book',
  styleUrl: './book.css',
  templateUrl: './book.html',
})
export class Book {
  protected readonly loadError = signal('');

  protected readonly cards$ = inject(CardService).getAll().pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as cartas.');
      return of(null);
    }),
  );

  protected imageFor(card: CatalogCard): string {
    return cardAsset(card.valor, card.naipe);
  }

  protected labelFor(card: CatalogCard): string {
    return cardLabel(card.valor, card.naipe);
  }
}
```

O sufixo `$` avisa ao leitor que `cards$` é um `Observable`. `of(null)` encerra o estado de carregamento após um erro; a mensagem continua guardada em `loadError`.

## Passo 3 — desenhar os quatro estados

```html
<main>
  <h1>Catálogo de cartas</h1>

  @if (loadError(); as message) {
    <p role="alert">{{ message }}</p>
  } @else if (cards$ | async; as cards) {
    <section class="cards">
      @for (card of cards; track card.id) {
        <article>
          <img [src]="imageFor(card)" [alt]="labelFor(card)" />
          <h2>{{ labelFor(card) }}</h2>
        </article>
      } @empty {
        <p>Nenhuma carta encontrada.</p>
      }
    </section>
  } @else {
    <p>Carregando cartas...</p>
  }
</main>
```

`cards$ | async` usa o `AsyncPipe` para assinar o fluxo. O pipe também cancela a inscrição quando o componente sai da tela, evitando **memory leaks** (vazamentos de memória).

`track card.id` permite que o Angular reutilize o elemento correto quando a lista muda.

## Passo 4 — entender a validação

O serviço lê a resposta como `unknown` e usa `isCatalogCard`. O tipo genérico do `HttpClient` não valida o JSON em execução. Se a API devolver uma carta incompleta, a tela recebe um erro em vez de desenhar dados quebrados.

## Passo 5 — testar

```ts
fixture.detectChanges();
http.expectOne(`${api}/cards`).flush([
  { id: 1, valor: 'AS', naipe: 'ESPADAS' },
]);
fixture.detectChanges();
```

`flush` significa “entregar a resposta simulada”. Não é necessário subir o servidor.

## Checklist

- [ ] `AsyncPipe` está em `imports`.
- [ ] A tela importa `CardService` de `services/modules`.
- [ ] A imagem é calculada com `cardAsset`.
- [ ] O `alt` descreve valor e naipe.
- [ ] Carregamento, vazio e erro têm mensagens diferentes.
- [ ] A tela não importa `mockCards`.
