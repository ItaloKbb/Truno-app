# Habilidades (`/habilidades`)

Nesta atividade, você vai criar uma tela de consulta para as habilidades disponíveis nas cartas.

## Objetivo

Criar o componente, registrar a rota e listar as habilidades devolvidas por `SkillService.getAll()`.

## Vocabulário da atividade

- **skill** (habilidade): efeito associado a uma carta.
- **definition** (definição): descrição de um tipo disponível no catálogo.
- **enum-like union** (união semelhante a enum): conjunto fechado de textos aceitos pelo TypeScript.
- **read-only catalog** (catálogo somente leitura): dados que a tela consulta, mas não altera.

## Passo 1 — criar e registrar

```bash
npm run ng -- generate component pages/habilidades
```

```ts
{
  path: 'habilidades',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/habilidades/habilidades').then((module) => module.Habilidades),
},
```

## Passo 2 — conhecer o modelo atual

`SkillService` oferece somente `getAll()`. Cada `SkillDefinition` possui `id`, `name`, `description`, `type`, `naipe` e `valor`.

Não use campos antigos como `effect` ou categorias `ATAQUE` e `DEFESA`. O campo `type` já é o efeito técnico, por exemplo `BLOCK`, `BUY`, `BOMB` ou `SHIELD`.

## Passo 3 — carregar a lista

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { SkillService } from '../../services/modules/skill.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-habilidades',
  templateUrl: './habilidades.html',
})
export class Habilidades {
  protected readonly loadError = signal('');
  protected readonly skills$ = inject(SkillService).getAll().pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as habilidades.');
      return of(null);
    }),
  );
}
```

## Passo 4 — desenhar o template

```html
<main>
  <h1>Habilidades</h1>

  @if (loadError(); as message) {
    <p role="alert">{{ message }}</p>
  } @else if (skills$ | async; as skills) {
    <ul>
      @for (skill of skills; track skill.id) {
        <li>
          <h2>{{ skill.name }}</h2>
          <p>{{ skill.description }}</p>
          <p>Tipo: {{ skill.type }}</p>
          <p>Carta: {{ skill.valor }} de {{ skill.naipe }}</p>
        </li>
      } @empty {
        <li>Nenhuma habilidade cadastrada.</li>
      }
    </ul>
  } @else {
    <p>Carregando habilidades...</p>
  }
</main>
```

Os textos em maiúsculas são valores do contrato com o backend. Se quiser uma tradução amigável, crie um mapa de apresentação; não altere o valor original.

## Passo 5 — conferir

1. Abra `/habilidades` com sessão.
2. Confira nome, descrição, tipo e carta.
3. Teste uma resposta vazia.
4. Teste um `type` inválido e confirme que o guarda rejeita a resposta.

## Erros comuns

- Chamar `getById()`: esse método não existe no serviço atual.
- Ler `skill.effect`: esse campo não existe.
- Importar o serviço do caminho antigo sem `modules`.
