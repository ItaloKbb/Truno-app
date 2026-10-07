# Guias práticos das telas

Estes tutoriais ensinam a ligar uma tela Angular aos serviços do projeto. Cada guia segue uma sequência curta: entender o objetivo, reconhecer os termos, implementar uma etapa por vez e conferir o resultado.

Antes de começar, leia [como os serviços estão organizados](../../services/index.md). Os arquivos compartilhados ficam em `services/config`; os serviços usados pelas telas ficam em `services/modules`.

## Como estudar com estes guias

Em cada etapa:

1. Leia a explicação antes de copiar o código.
2. Digite ou adapte um bloco por vez.
3. Salve o arquivo e observe os erros do TypeScript.
4. Teste no navegador antes de seguir.
5. Ao terminar, use o checklist do guia.

Copiar tudo de uma vez pode esconder qual alteração causou um erro. O objetivo é compreender o caminho percorrido pelo dado.

## Vocabulário essencial

| Termo | Significado no projeto |
| --- | --- |
| **component** (componente) | Classe e template que formam uma parte da interface. |
| **template** (modelo de tela) | Arquivo HTML do componente. |
| **service** (serviço) | Classe que concentra acesso à API ou outra responsabilidade compartilhada. |
| **dependency injection** (injeção de dependência) | Mecanismo do Angular que entrega uma instância com `inject(...)`. Por isso não usamos `new CardService()`. |
| **endpoint** (ponto de acesso) | Endereço da API, como `GET /cards`. |
| **request** (requisição) | Pedido enviado pelo navegador à API. |
| **response** (resposta) | Dados e status devolvidos pela API. |
| **payload** (carga de dados) | Objeto enviado no corpo de uma requisição, normalmente em um `POST`. |
| **Observable** (fluxo observável) | Valor que pode chegar depois. Uma chamada HTTP do Angular devolve um `Observable`. |
| **subscribe** (inscrever-se) | Iniciar e acompanhar um `Observable` pelo TypeScript. É útil para ações disparadas por botão. |
| **AsyncPipe** (pipe assíncrono) | Operador `| async` do template. Ele se inscreve e cancela a inscrição automaticamente. |
| **signal** (sinal) | Estado reativo local. Ao chamar `set` ou `update`, o Angular atualiza a parte dependente da tela. |
| **guard** (guarda de rota ou de tipo) | Regra de proteção. `authGuard` protege rotas; funções como `isCatalogCard` validam dados. |
| **mock** (dado simulado) | Dado falso usado em testes. Uma tela real não importa os arquivos de `models/mock`. |

## O caminho do dado

```text
template -> component -> service -> API
   ^                               |
   |---------- response -----------|
```

O componente pede o dado ao serviço. O serviço chama a API e valida a resposta. Quando o valor chega, o componente o entrega ao template.

Uma tela de leitura deve representar quatro estados:

| Estado | Significado | Exemplo de mensagem |
| --- | --- | --- |
| Carregando | A resposta ainda não chegou. | `Carregando cartas...` |
| Sucesso | A API devolveu dados válidos. | A lista ou o objeto. |
| Vazio | A resposta é válida, mas a lista não tem itens. | `Nenhuma carta encontrada.` |
| Erro | A rede falhou ou a resposta foi inválida. | Mensagem com `role="alert"`. |

Lista vazia não é erro. Erro também não deve ser convertido silenciosamente em lista vazia.

## Mapa dos tutoriais

| Tela | Rota | Serviço principal | Guia |
| --- | --- | --- | --- |
| Entrada | `/home` | `AuthService` | [Login](login.md) |
| Catálogo | `/book` | `CardService` | [Catálogo](catalogo.md) |
| Lobby | `/lobby` | `GameService` | [Lobby](lobby.md) |
| Partida | `/partida/:id` | `GameService` | [Partida](partida.md) |
| Ranking | `/ranking` | `RankingService` | [Ranking](ranking.md) |
| Perfil | `/perfil` | `ProfileService` | [Perfil](perfil.md) |
| Coleção | `/perfil/colecao` | `ProfileService` | [Coleção](colecao.md) |
| Conquistas | `/perfil/conquistas` | `ProfileService` | [Conquistas](conquistas.md) |
| Histórico | `/perfil/historico` | `ProfileService` | [Histórico](historico.md) |
| Configurações | `/perfil/configuracoes` | `ProfileStorage` e `AuthService` | [Configurações](configuracoes.md) |
| Loja | `/loja` | `ShopService` | [Loja](loja.md) |
| Habilidades | `/habilidades` | `SkillService` | [Habilidades](habilidades.md) |
| Perguntas | `/perguntas` | `PuzzleService` | [Perguntas](perguntas.md) |

## Receita para criar uma tela

### Passo 1 — gerar o componente

```bash
npm run ng -- generate component pages/loja
```

`generate` significa “gerar”. O Angular CLI cria os arquivos TypeScript, HTML, CSS e teste.

### Passo 2 — registrar a rota

Adicione a rota antes do curinga `**` em `src/app/app.routes.ts`:

```ts
{
  path: 'loja',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/loja/loja').then((module) => module.Loja),
},
```

`loadComponent` faz **lazy loading** (carregamento sob demanda): o código da tela só é carregado quando a rota é aberta. O curinga `**` captura rotas desconhecidas; por isso deve continuar por último.

### Passo 3 — ligar o serviço

Para leitura, use `AsyncPipe`:

```ts
protected readonly loadError = signal('');
protected readonly items$ = inject(UmService).getAll().pipe(
  catchError((error: unknown) => {
    this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar.');
    return of(null);
  }),
);
```

O sufixo `$` é uma convenção para indicar um `Observable`. `pipe` significa “encadear operadores”; aqui ele conecta o tratamento de erro ao fluxo.

### Passo 4 — representar os estados no HTML

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

`track` informa a identidade de cada item e evita recriar elementos desnecessariamente. `@empty` só é usado quando a lista chegou vazia.

### Passo 5 — validar

```bash
npx ng test --watch=false
npm run build
```

`build` significa “construção”: o Angular compila o projeto como faria para publicação.

## Ordem sugerida

1. [Login](login.md), para aprender formulários e `subscribe`.
2. [Catálogo](catalogo.md), para aprender leitura com `AsyncPipe`.
3. [Lobby](lobby.md) e [Partida](partida.md), para acompanhar uma operação completa.
4. [Ranking](ranking.md), [Habilidades](habilidades.md) e [Perguntas](perguntas.md), para praticar listas.
5. [Perfil](perfil.md) e suas subseções.
6. [Loja](loja.md), para praticar um objeto que contém uma lista.
