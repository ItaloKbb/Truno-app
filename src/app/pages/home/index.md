# Como criar e acessar uma nova tela no Angular

Este projeto usa componentes **standalone** e o padrao atual do Angular CLI. Uma tela e um
componente localizado dentro de `src/app/pages`, registrado em `app.routes.ts` e exibido pelo
`<router-outlet />` do componente principal.

O exemplo abaixo cria uma tela chamada **Ranking**, disponivel na rota `/ranking`.

## 1. Instalar as dependencias

Na raiz do projeto, execute:

```bash
npm install
```

Esse comando precisa ser executado apenas no primeiro uso ou quando as dependencias do
`package.json` forem alteradas.

## 2. Gerar a nova tela

Execute o gerador do Angular a partir da raiz do projeto:

```bash
npm run ng -- generate component pages/ranking
```

A forma abreviada equivalente e:

```bash
npm run ng -- g c pages/ranking
```

O Angular cria a seguinte estrutura:

```text
src/app/pages/ranking/
|-- ranking.css
|-- ranking.html
|-- ranking.spec.ts
`-- ranking.ts
```

Cada arquivo possui uma responsabilidade:

- `ranking.ts`: classe, estado, dependencias e configuracao do componente.
- `ranking.html`: estrutura visual da tela.
- `ranking.css`: estilos exclusivos da tela.
- `ranking.spec.ts`: testes unitarios do componente.

## 3. Implementar o componente

O arquivo `src/app/pages/ranking/ranking.ts` deve seguir o mesmo formato de `home.ts`:

```ts
import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-ranking',
  styleUrl: './ranking.css',
  templateUrl: './ranking.html',
})
export class Ranking {}
```

Como o componente e standalone, componentes, diretivas e pipes usados no HTML devem ser
adicionados ao array `imports`.

## 4. Criar o conteudo da tela

Edite `src/app/pages/ranking/ranking.html`:

```html
<main>
  <h1>Ranking</h1>
  <p>Confira a classificacao dos jogadores.</p>
</main>
```

Depois, adicione os estilos em `src/app/pages/ranking/ranking.css`:

```css
:host {
  display: block;
  padding: 1.5rem;
}
```

## 5. Registrar a rota

Abra `src/app/app.routes.ts` e adicione uma rota para a nova tela:

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'ranking',
    loadComponent: () => import('./pages/ranking/ranking').then((module) => module.Ranking),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

Detalhes importantes:

- O `path` e escrito sem `/`: use `ranking`, nao `/ranking`.
- `loadComponent` carrega a tela somente quando a rota for acessada.
- A rota `**` deve ser a ultima, pois captura enderecos que nao existem.
- A rota vazia (`path: ''`) torna a tela `Home` a pagina inicial.

O roteador ja esta habilitado por `provideRouter(routes)` em `app.config.ts`. O arquivo
`app.html` tambem ja possui `<router-outlet />`, que e o local onde a tela da rota ativa sera
renderizada.

## 6. Criar um link para a tela

Para navegar sem recarregar a aplicacao, importe `RouterLink` no componente que contem o link.
Por exemplo, em `home.ts`:

```ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
```

Em seguida, adicione o link em `home.html`:

```html
<a routerLink="/ranking">Acessar ranking</a>
```

No `routerLink`, a barra inicial e recomendada para indicar uma rota absoluta.

## 7. Executar a aplicacao

Inicie o servidor de desenvolvimento:

```bash
npm start
```

O Angular recompila a aplicacao automaticamente quando um arquivo e alterado.

## 8. Acessar a tela

Com o servidor em execucao, existem duas formas de abrir a tela:

1. Acesse `http://localhost:4200/` e clique em **Acessar ranking**.
2. Abra diretamente `http://localhost:4200/ranking` no navegador.

Se a porta `4200` estiver ocupada, execute:

```bash
npm start -- --port 4201
```

Nesse caso, a URL passa a ser `http://localhost:4201/ranking`.

## 9. Testar e validar

Execute os testes unitarios:

```bash
npm test
```

Valide tambem a compilacao de producao:

```bash
npm run build
```

Antes de concluir, confirme que:

- A pasta da tela esta dentro de `src/app/pages`.
- A classe exportada possui o mesmo nome usado em `loadComponent`.
- O caminho do `import()` aponta para o arquivo correto.
- A rota foi adicionada antes da rota curinga `**`.
- Dependencias usadas no template estao no array `imports` do componente.
- A URL abre sem erros no console do navegador.

## Erros comuns

### A URL mostra uma pagina vazia

Confirme se `app.html` possui `<router-outlet />` e se `RouterOutlet` esta no array `imports` de
`app.ts`. Ambos ja estao configurados neste projeto.

### `Can't bind to 'routerLink'`

Adicione `RouterLink` ao array `imports` do componente que usa a diretiva.

### `Cannot find module './pages/ranking/ranking'`

Confira o nome da pasta, do arquivo e o caminho relativo a partir de `app.routes.ts`.

### A rota curinga sempre abre a Home

Mova `{ path: '**', redirectTo: '' }` para o final da lista de rotas.

### O componente nao aparece apos a navegacao

Confira se a classe exportada em `ranking.ts` se chama `Ranking` e se o `loadComponent` retorna
`module.Ranking`.
