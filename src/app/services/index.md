# Como criar um service neste projeto

Para ligar esses services às telas, use os guias em [src/app/pages/guias](../pages/guias/index.md).

Um service concentra uma responsabilidade: buscar dados na API, validar a resposta e devolver um
`Observable` tipado. O componente fica com a tela. Ele não chama `HttpClient`, não importa mock e
não decide de onde o dado veio.

O Truno usa Angular 22, componentes standalone e `inject()`. O decorator dos services é
`@Injectable({ providedIn: 'root' })`. Isso cria uma única instância para a aplicação inteira, sem
registrar o service nos `providers` de cada componente.

## O que já existe

| Service | Responsabilidade | Endpoints |
| --- | --- | --- |
| `AuthService` | Login, sessão e logout | `/api/auth/login`, `/api/auth/session`, `/api/auth/logout`, `/api/auth/forgot-password` |
| `AuthSessionStore` | Guarda o token e o `User` no navegador | nenhum |
| `CardService` | Baralho espanhol | `GET /api/cards`, `GET /api/cards/:id` |
| `GameService` | Criar, acessar e jogar partidas | `POST /api/games`, `POST /api/games/access`, ações de partida |
| `ShopService` | Loja | `GET /api/shop` |
| `SkillService` | Habilidades | `GET /api/skills`, `GET /api/skills/:id` |
| `PuzzleService` | Perguntas | `GET /api/puzzles`, `GET /api/puzzles/:id` |
| `ProfileService` | Perfil remoto | `GET /api/profile`, `/stats`, `/collection`, `/achievements`, `/activities` |
| `ProfileStorage` | Rascunho do perfil salvo no navegador | nenhum |

`AuthService` e `ProfileStorage` não seguem só leitura de catálogo: o primeiro grava a sessão e o
segundo persiste o rascunho local. Um resource novo de API deve seguir `CardService`.

Os contratos ficam em `src/app/domain`. Os arquivos de `src/app/models` reexportam esses tipos para
quem já importava de lá. Service novo importa o tipo do domínio.

## Como a chamada atravessa o projeto

```text
tela
  -> CardService.getAll()
    -> readApi + isCard
      -> HttpClient GET /api/cards
        -> authInterceptor acrescenta Authorization, se houver token
          -> catalogRouter em src/server/catalog-api.ts
```

`provideHttpClient` já está em `src/app/app.config.ts`, com `withFetch()` e o `authInterceptor`.
Não troque esses providers por uma lista nova. Não importe `HttpClientModule`.

O interceptor lê o token em `AuthSessionStore` e envia `Authorization: Bearer <token>`. Se uma
requisição autenticada responder `401`, ele apaga a sessão. O `POST /api/auth/login` fica de fora
dessa limpeza, porque uma senha errada também responde `401`.

## 1. Definir o contrato

Se o recurso ainda não existir, descreva a interface em `src/app/domain` e exporte pelo
`src/app/domain/index.ts`. O service e a rota da API usam esse mesmo tipo.

Exemplo de uma coleção de rankings:

```ts
export interface RankingEntry {
  id: string;
  username: string;
  wins: number;
}
```

## 2. Gerar os arquivos

Na raiz do projeto:

```bash
npm run ng -- generate service services/ranking
```

O mesmo comando abreviado:

```bash
npm run ng -- g s services/ranking
```

O Angular cria:

```text
src/app/services/
|-- ranking.service.ts
`-- ranking.service.spec.ts
```

O CLI já gera `@Injectable({ providedIn: 'root' })`. Mantenha esse decorator. Este projeto não usa
`@Service()`.

## 3. Validar a resposta

`HttpClient.get<RankingEntry[]>()` só informa o TypeScript. Em execução, a API pode devolver outro
formato. Por isso os services leem `unknown` e passam por um type guard.

Abra `src/app/services/api-response.ts` e acrescente o guard ao lado dos que já existem (`isCard`,
`isGame`, `isShop`, `isSkill`, `isPuzzle`, `isProfile`):

```ts
export function isRankingEntry(value: unknown): value is RankingEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return typeof entry['id'] === 'string' && typeof entry['username'] === 'string' && typeof entry['wins'] === 'number';
}
```

`readApi` faz o resto, e é o que `CardService` já usa:

1. Executa o `parse` na resposta.
2. Se o JSON não passar no guard, `expectList` ou `expectOne` lança `Resposta inválida.`
3. Se a requisição falhar ou o parse falhar, registra o erro técnico e devolve `throwError` com uma
   frase que a tela pode mostrar.

Não capture o erro dentro do service para devolver `of([])`. Uma lista vazia é uma resposta válida
sem itens. Uma falha de rede precisa continuar sendo erro.

## 4. Implementar o service

`src/app/services/ranking.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RankingEntry } from '../domain/ranking';
import { expectList, expectOne, isRankingEntry, readApi } from './api-response';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/rankings';

  getAll(): Observable<RankingEntry[]> {
    return readApi(
      this.http.get<unknown>(this.apiUrl),
      (body) => expectList(body, isRankingEntry),
      'Falha ao carregar o ranking.',
    );
  }

  getById(id: string): Observable<RankingEntry> {
    return readApi(
      this.http.get<unknown>(`${this.apiUrl}/${id}`),
      (body) => expectOne(body, isRankingEntry),
      'Falha ao carregar a posição.',
    );
  }
}
```

Regras que os services atuais seguem:

- Um service por responsabilidade. Ranking não entra em `CardService`.
- A URL fica no service, relativa e começando com `/api`. A tela não monta o endereço.
- Método público curto: `getAll`, `getById`, `create`. `ShopService.get()` existe porque a loja é
  um único recurso, não uma coleção.
- O retorno é `Observable`. A requisição só sai quando alguém se inscreve: `AsyncPipe`, `toSignal()`
  ou `subscribe()`.
- Não guarde a lista carregada numa propriedade mutável do service. Quem precisa do valor é a tela.

## 5. Publicar a rota na API

As rotas de catálogo ficam em `src/server/catalog-api.ts` e são montadas em `src/server.ts` com
`app.use('/api', catalogRouter(...))`. Autenticação fica separada em `src/server/auth-api.ts`.

Para o ranking, devolva os dados no `createCatalogApi()` e registre a rota antes do handler do
Angular:

```ts
router.get('/rankings', (_request, response) => response.json(api.rankings()));
router.get('/rankings/:id', (request, response) =>
  sendOne(response, api.ranking(routeId(request.params['id'])), 'Posição não encontrada.'),
);
```

`sendOne` responde `404` com `{ message }` quando o id não existe. O `readApi` do service transforma
esse HTTP em `Falha ao carregar a posição.`

Os mocks de `src/app/models/mock` alimentam o catálogo do servidor e os testes. Eles não são a
implementação do service. A tela não importa `mockCards` nem outro mock.

## 6. Usar o service na tela

O catálogo em `src/app/pages/book` é o exemplo real. O componente pede as cartas, guarda a mensagem
de erro e deixa o template desenhar carregamento, lista ou falha.

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

`AsyncPipe` precisa estar no array `imports` do componente. Ele abre e fecha a inscrição quando o
componente é destruído. Prefira isso a um `subscribe()` manual.

No template, a ordem importa: erro, dados e só então o carregamento. `of(null)` no `catchError`
existe para o `AsyncPipe` encerrar a espera; a mensagem vem do `signal`, não de uma lista vazia.

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

`@empty` é a resposta válida sem itens. `role="alert"` é a falha. Os dois estados não podem usar o
mesmo texto.

Um formulário que envia dados, como o login, pode usar `subscribe` no envio. Leitura para a tela
continua com `AsyncPipe`.

## 7. Testar

O teste do service não sobe a API. `provideHttpClientTesting()` intercepta o `HttpClient`.
`http.verify()` no `afterEach` falha se alguma requisição ficou sem resposta ou se o service chamou
um endereço inesperado.

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  let service: RankingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RankingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the ranking', () => {
    const received: unknown[] = [];
    service.getAll().subscribe((entries) => received.push(entries));

    const request = http.expectOne('/api/rankings');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'rank-1', username: 'lucasmartins', wins: 10 }]);

    expect(received).toEqual([[{ id: 'rank-1', username: 'lucasmartins', wins: 10 }]]);
  });

  it('reports a load failure instead of an empty list', () => {
    const errors: Error[] = [];
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    service.getAll().subscribe({ error: (error: Error) => errors.push(error) });
    http.expectOne('/api/rankings').flush(null, { status: 500, statusText: 'Server Error' });

    expect(errors.map((error) => error.message)).toEqual(['Falha ao carregar o ranking.']);
  });
});
```

O corpo do `flush` precisa passar no type guard. Se faltar `wins`, o service erro é o esperado:
`readApi` rejeita a resposta inválida.

Para a rota do servidor, teste `createCatalogApi()` direto, como `src/server/catalog-api.spec.ts`.
Não precisa subir o Express para conferir a coleção, o `404` e o `400`.

Na tela, o `TestBed` também recebe `provideHttpClient()` e `provideHttpClientTesting()`. Dê
`detectChanges()` para o `AsyncPipe` assinar, responda com `expectOne` e confira o HTML. O teste de
`Book` faz isso com as duas primeiras cartas do baralho.

Rode tudo com:

```bash
npm test
```

O Angular executa os `*.spec.ts` pelo Vitest. `npm test` fica observando; para uma execução só:

```bash
npx ng test --watch=false
```

Antes de concluir, compile:

```bash
npm run build
```

## Checklist de um service novo

1. Interface no domínio, exportada por `src/app/domain/index.ts`.
2. `npm run ng -- generate service services/nome`.
3. Type guard em `api-response.ts`.
4. Métodos com `readApi`, URL `/api/...` e mensagem de falha específica.
5. Rota em `catalog-api.ts`, ou em `auth-api.ts` se for sessão.
6. Tela consome o `Observable` e desenha carregando, vazio e erro.
7. Spec do service com `HttpTestingController`, spec da rota e spec da tela se o HTML mudou.
8. `npx ng test --watch=false` e `npm run build`.

## O que não fazer

- Não usar `@Service()`. Esse decorator não faz parte do Angular deste projeto.
- Não colocar `HttpClient` no componente.
- Não importar `src/app/models/mock` na tela. Mock é dado do servidor e dos testes.
- Não devolver `[]` no `catchError` de uma falha.
- Não substituir os providers de `app.config.ts`. `provideHttpClient` e o interceptor já estão lá.
- Não confiar só no genérico do `HttpClient`. Sem o guard, um JSON inesperado entra na tela como se
  fosse o tipo do domínio.
