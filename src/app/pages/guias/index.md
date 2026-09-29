# Guias das telas

Estes guias são para usar hoje. O service de cada tela já existe. O seu trabalho é criar ou completar a tela e pedir os dados para esse service.

Leia primeiro [como um service funciona](../../services/index.md). A receita genérica de pasta, rota e `router-outlet` está em [pages/home/index.md](../home/index.md). Daqui para a frente o foco é outro: **como a tela usa o service**.

## Regra que vale para todas

A tela não importa arquivo de `src/app/models/mock`. Ela não chama `HttpClient`. Ela injeta um service e trata três situações:

| Situação | O que o service fez | O que a tela mostra |
| --- | --- | --- |
| Carregando | A requisição ainda não voltou | Um texto como "Carregando..." |
| Vazio | Voltou uma lista válida com zero itens | "Nenhum item encontrado." |
| Erro | A rede falhou ou o JSON não passou no guard | A `message` do `Error`, com `role="alert"` |

Lista vazia não é erro. Erro não vira lista vazia.

Quase toda tela fica atrás do `authGuard`. Sem sessão, o Angular manda para `/home?returnUrl=...`. Para ver a tela, entre com `lucasmartins@truno.app` e senha `truno1234`.

O `HttpClient` e o interceptor de autenticação já estão em `app.config.ts`. Não mexa neles para criar uma tela.

## Mapa

| Tela | Rota | Service | Guia | Situação da pasta |
| --- | --- | --- | --- | --- |
| Login | `/home` | `AuthService` | [login.md](login.md) | Pronta. É o modelo de formulário. |
| Catálogo | `/book` | `CardService` | [catalogo.md](catalogo.md) | Pronta. É o modelo de leitura. |
| Lobby | `/lobby` | `LobbyService` | [lobby.md](lobby.md) | Existe, ainda sem o service. |
| Loja | `/loja` | `ShopService` | [loja.md](loja.md) | Criar. |
| Habilidades | `/habilidades` | `SkillService` | [habilidades.md](habilidades.md) | Criar. |
| Perguntas | `/perguntas` | `PuzzleService` | [perguntas.md](perguntas.md) | Criar. |
| Partida | `/partida` | `GameService` | [partida.md](partida.md) | Criar. |
| Perfil | `/perfil` | `ProfileService` | [perfil.md](perfil.md) | Existe. Trocar os números fixos pelos dados do service. |
| Coleção | `/perfil/colecao` | `ProfileService.getCollection` | [colecao.md](colecao.md) | A rota existe. Os dados ainda estão escritos na tela. |
| Conquistas | `/perfil/conquistas` | `ProfileService.getAchievements` | [conquistas.md](conquistas.md) | A rota existe. Os dados ainda estão escritos na tela. |
| Histórico | `/perfil/historico` | `ProfileService.getActivities` | [historico.md](historico.md) | A rota existe. Os dados ainda estão escritos na tela. |
| Configurações | `/perfil/configuracoes` | `ProfileStorage` e `AuthService` | [configuracoes.md](configuracoes.md) | A rota existe. É a tela que grava no navegador e encerra a sessão. |

## Receita de uma tela nova

Na raiz do projeto:

```bash
npm run ng -- generate component pages/loja
```

Em `src/app/app.routes.ts`, registre a rota **antes** de `{ path: '**', redirectTo: 'home' }`:

```ts
{
  path: 'loja',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/loja/loja').then((module) => module.Loja),
},
```

`authGuard` já está importado nesse arquivo. A rota protegida é renderizada no navegador por causa de `path: '**'` em `app.routes.server.ts`. Não precisa cadastrar cada tela nova lá.

Suba o projeto com `npm start` e abra `http://localhost:4200/loja` depois do login.

## Como ligar o service

Leitura, o caso do catálogo, da loja, das habilidades e da coleção:

```ts
protected readonly loadError = signal('');
protected readonly items$ = inject(UmService)
  .getAll()
  .pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar.');
      return of(null);
    }),
  );
```

`of(null)` no erro existe para o `AsyncPipe` parar de esperar. A frase vem do `signal`. `AsyncPipe` entra no array `imports` do componente.

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (items$ | async; as items) {
  @for (item of items; track item.id) {
    <article>{{ item.name }}</article>
  } @empty {
    <p>Nenhum item encontrado.</p>
  }
} @else {
  <p>Carregando...</p>
}
```

Formulário, o caso do login e de criar uma mesa: o clique chama `subscribe`. Não use `AsyncPipe` para um `POST` disparado pelo botão.

## Ordem sugerida para hoje

1. Leia o [catálogo](catalogo.md) e o [login](login.md). São as duas formas de usar service.
2. Faça o [lobby](lobby.md): a pasta já existe e o service também.
3. Crie [loja](loja.md), [habilidades](habilidades.md) e [perguntas](perguntas.md). As três são listas.
4. Faça a [partida](partida.md).
5. Ligue o [perfil](perfil.md) e, em seguida, [coleção](colecao.md), [conquistas](conquistas.md), [histórico](historico.md) e [configurações](configuracoes.md).
