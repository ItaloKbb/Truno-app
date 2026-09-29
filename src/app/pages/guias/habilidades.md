# Habilidades (`/habilidades`)

Você cria esta tela. Ela lista o que uma carta pode disparar no Truno. O service é o `SkillService`. A forma é a mesma do catálogo.

## Qual service

| Método | Uso |
| --- | --- |
| `getAll()` | A lista da página |
| `getById(id)` | O detalhe, se você criar `/habilidades/:id` |

Cada `Skill` tem `id`, `name`, `description`, `type`, `effect`, `naipe` e `valor`.

`type` é a categoria: `DEFESA`, `ATAQUE`, `SUPORTE` ou `CONTROLE`. `effect` é o efeito de UNO, por exemplo `BLOCK` ou `DRAW`. Mostre os dois. Eles não são a mesma coisa: o tipo agrupa, o efeito é o que a carta faz.

## Criar e registrar

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

A rota fica antes do `**`.

## A classe

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { SkillService } from '../../services/skill.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-habilidades',
  templateUrl: './habilidades.html',
})
export class Habilidades {
  protected readonly loadError = signal('');
  protected readonly skills$ = inject(SkillService)
    .getAll()
    .pipe(
      catchError((error: unknown) => {
        this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as habilidades.');
        return of(null);
      }),
    );
}
```

O nome da classe gerada é `Habilidades`. O `loadComponent` tem de devolver `module.Habilidades`. Se os nomes divergirem, a rota abre uma tela em branco.

## O template

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
          <span>{{ skill.type }}</span>
          <span>{{ skill.effect }}</span>
          <span>{{ skill.valor }} de {{ skill.naipe }}</span>
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

Filtro por categoria pode ser um `signal` na tela. Não crie outro método no service só para filtrar: a lista já chegou. Algo como `skills.filter((skill) => skill.type === category())` no template, ou um getter. O service continua responsável só por buscar.

## Erro e teste

A mensagem de falha do service é "Falha ao carregar as habilidades." No teste, `expectOne('/api/skills')` e dê `flush` com pelo menos um objeto que tenha `id`, `name`, `description`, `type`, `effect`, `naipe` e `valor`. `type` e `effect` precisam ser um dos valores do domínio. `type: 'MAGIA'` não passa no guard e a tela cai no alerta, mesmo com HTTP 200.
