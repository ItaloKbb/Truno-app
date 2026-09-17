# Como criar e usar services no Angular

Services concentram regras de negócio, acesso a APIs e estado compartilhado. Dessa forma, os
componentes ficam responsáveis pela interface, enquanto o service decide de onde os dados vêm e
como são tratados.

Este projeto usa Angular 22, componentes standalone e a função `inject()` para injeção de
dependências. Os exemplos abaixo criam um service para as cartas do jogo.

## 1. Gerar o service

Na raiz do projeto, execute:

```bash
npm run ng -- generate service services/card
```

A forma abreviada equivalente é:

```bash
npm run ng -- g s services/card
```

O Angular cria estes arquivos:

```text
src/app/services/
|-- card.service.spec.ts
`-- card.service.ts
```

- `card.service.ts`: implementação do service.
- `card.service.spec.ts`: testes unitários do service.

O Angular 22 cria o service com `@Service()`. Esse decorator fornece automaticamente uma única
instância no nível raiz da aplicação, sem precisar adicioná-la aos `providers` de cada componente.

## 2. Implementar o acesso à API

Edite `src/app/services/card.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import Card from '../models/card';

@Service()
export class CardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/cards';

  getAll(): Observable<Card[]> {
    return this.http.get<Card[]>(this.apiUrl);
  }

  getById(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/${id}`);
  }

  create(card: Card): Observable<Card> {
    return this.http.post<Card>(this.apiUrl, card);
  }

  update(card: Card): Observable<Card> {
    return this.http.put<Card>(`${this.apiUrl}/${card.id}`, card);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

Para services novos e globais, prefira `@Service()` com `inject()`. Use o decorator tradicional
`@Injectable({ providedIn: 'root' })` quando precisar de injeção pelo construtor, escopos que não
sejam o root ou configurações avançadas de provider. O CLI pode gerar esse formato com:

```bash
npm run ng -- generate service services/card --injectable
```

Cada método retorna um `Observable`. A requisição só é enviada quando o observable recebe uma
inscrição, por exemplo pelo `AsyncPipe`, por `toSignal()` ou por `subscribe()`.

O tipo informado ao `HttpClient`, como `get<Card[]>()`, descreve o formato esperado da resposta.
Ele ajuda o TypeScript, mas não valida os dados recebidos em tempo de execução. A API ainda deve
respeitar o contrato definido em `src/app/models/card.ts`.

## 3. Configurar o HttpClient

No Angular 22, usado neste projeto, o `HttpClient` já está disponível para injeção. Não é
necessário importar `HttpClientModule`.

Quando for preciso configurar interceptors ou outros recursos HTTP, use `provideHttpClient` em
`src/app/app.config.ts`:

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};
```

Não substitua os providers que já existem no arquivo. Adicione `provideHttpClient(...)` ao array
existente quando essa configuração for necessária.

## 4. Usar o service em uma tela

Injete o service no componente e exponha o observable para o template. Por exemplo, em uma tela
`cards.ts`:

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CardService } from '../../services/card.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-cards',
  styleUrl: './cards.css',
  templateUrl: './cards.html',
})
export class Cards {
  private readonly cardService = inject(CardService);

  protected readonly cards$ = this.cardService.getAll();
}
```

No template `cards.html`, consuma o resultado com o `AsyncPipe`:

```html
@if (cards$ | async; as cards) {
  <ul>
    @for (card of cards; track card.id) {
      <li>
        <img [src]="card.url" [alt]="card.valor + ' de ' + card.naipe" />
        <span>{{ card.valor }} de {{ card.naipe }}</span>
      </li>
    } @empty {
      <li>Nenhuma carta encontrada.</li>
    }
  </ul>
} @else {
  <p>Carregando cartas...</p>
}
```

O `AsyncPipe` cria e encerra a inscrição automaticamente quando o componente é destruído. Para
leituras simples, prefira esse formato a um `subscribe()` manual.

## 5. Tratar erros

O service pode transformar erros técnicos em um comportamento previsível para a interface:

```ts
import { catchError, Observable, throwError } from 'rxjs';

getAll(): Observable<Card[]> {
  return this.http.get<Card[]>(this.apiUrl).pipe(
    catchError((error: unknown) => {
      console.error('Não foi possível carregar as cartas.', error);
      return throwError(() => new Error('Falha ao carregar as cartas.'));
    }),
  );
}
```

Não esconda erros retornando uma lista vazia em todos os casos. Isso faria a interface confundir
uma falha de conexão com uma resposta válida sem itens.

## 6. Testar o service

Para testar regras que não fazem HTTP, injete o service pelo `TestBed` e verifique diretamente os
métodos. Para requisições, use o backend de teste do Angular em vez de chamar uma API real:

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CardService } from './card.service';

describe('CardService', () => {
  let service: CardService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CardService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('deve buscar todas as cartas', () => {
    service.getAll().subscribe((cards) => {
      expect(cards).toHaveLength(1);
    });

    const request = httpTesting.expectOne('/api/cards');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'card-h-a',
        naipe: 'COPAS',
        valor: 'A',
        url: '/assets/cards/AH.png',
      },
    ]);
  });
});
```

Execute os testes com:

```bash
npm test
```

## Boas práticas

- Crie um service por responsabilidade, como `CardService`, `GameService` ou `ShopService`.
- Mantenha chamadas HTTP fora dos componentes.
- Use os models para tipar parâmetros e respostas.
- Mantenha métodos públicos pequenos e com nomes claros, como `getAll`, `getById` e `create`.
- Evite armazenar estado mutável global no service sem necessidade.
- Use URLs relativas ou configurações de ambiente; não espalhe endereços da API pelos componentes.
- Deixe o tratamento visual de carregamento, vazio e erro sob responsabilidade da tela.

## Como usar mocks enquanto a API não existe

Os mocks deste projeto ficam em `src/app/models/mock`. Por exemplo, o arquivo
`card.mock.ts` exporta `mockCards`, uma coleção completa tipada como `Card[]`.

O componente não deve importar o mock diretamente. Mantenha o mesmo contrato do service e troque
somente a implementação interna. Assim, quando a API estiver pronta, nenhuma tela precisará ser
reescrita.

Enquanto a API não estiver disponível, implemente `getAll()` desta forma:

```ts
import { Service } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import Card from '../models/card';
import { mockCards } from '../models/mock/card.mock';

@Service()
export class CardService {
  getAll(): Observable<Card[]> {
    const cards = mockCards.map((card) => ({ ...card }));

    return of(cards).pipe(delay(300));
  }
}
```

O `of()` mantém o retorno como `Observable<Card[]>`, igual ao retorno futuro do `HttpClient`. A
cópia feita com `map()` impede que uma tela altere acidentalmente o mock original. O `delay(300)` é
opcional, mas ajuda a validar o estado de carregamento da interface.

Se for necessário alternar temporariamente entre mock e API no mesmo service, centralize a chave:

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import Card from '../models/card';
import { mockCards } from '../models/mock/card.mock';

@Service()
export class CardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/cards';
  private readonly useMock = true;

  getAll(): Observable<Card[]> {
    if (this.useMock) {
      return of(mockCards.map((card) => ({ ...card }))).pipe(delay(300));
    }

    return this.http.get<Card[]>(this.apiUrl);
  }
}
```

Para conectar a API posteriormente:

1. Altere `useMock` para `false` ou remova a condição.
2. Confirme o endereço em `apiUrl`.
3. Verifique se a resposta da API segue o model `Card`.
4. Remova imports e código de mock que não forem mais necessários.
5. Execute `npm test` e `npm run build`.

Mantenha os mocks no projeto quando eles ainda forem úteis para testes, Storybook ou desenvolvimento
offline. Remova apenas a dependência deles no caminho de produção.
