# Partida (`/partida`)

Você cria esta tela. Ela mostra a partida que o `GameService` conhece: quem está na mesa, quantas cartas cada um tem e em que pé está a mão.

## Qual service

| Método | Uso |
| --- | --- |
| `getAll()` | A lista, se houver mais de uma partida |
| `getById(id)` | Uma partida. A de exemplo tem id `game-1` |

Um `Game` tem `id`, `name`, `status` (`PENDENTE`, `EM_ANDAMENTO` ou `FINALIZADO`), `players`, `rounds`, `winner`, `pointsToWin`, `direction` (`HORARIO` ou `ANTI_HORARIO`), `currentSuit` e `handSize`.

Cada lugar em `players` é um `PlayerSeat`: `user` (com `name`), `cards`, `points`, `trophies`, `effect` e `calledUno`. A quantidade de cartas na mão é `player.cards.length`. Não peça outro endpoint para contar.

Cada `rounds[]` é uma mão, com `number`, `status`, `tricks` e `winnerId`.

## Criar e registrar

```bash
npm run ng -- generate component pages/partida
```

```ts
{
  path: 'partida',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/partida/partida').then((module) => module.Partida),
},
```

Para a aula de hoje, abra direto a partida `game-1`. Quando existir seleção, troque a string pelo id clicado na lista.

## A classe

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { GameService } from '../../services/game.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-partida',
  templateUrl: './partida.html',
})
export class Partida {
  protected readonly loadError = signal('');
  protected readonly game$ = inject(GameService)
    .getById('game-1')
    .pipe(
      catchError((error: unknown) => {
        this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar a partida.');
        return of(null);
      }),
    );
}
```

`getById` emite um objeto. No template, `@if (game$ | async; as game)` entrega esse objeto. Não faça `@for` nele.

## O template

```html
<main>
  @if (loadError(); as message) {
    <p role="alert">{{ message }}</p>
  } @else if (game$ | async; as game) {
    <h1>{{ game.name }}</h1>
    <p>{{ game.status }} · vale {{ game.pointsToWin }} · {{ game.direction }}</p>
    <p>
      @if (game.currentSuit) {
        Naipe da vez: {{ game.currentSuit }}
      } @else {
        A saída está livre.
      }
    </p>

    <ul>
      @for (player of game.players; track player.user.id) {
        <li>
          <strong>{{ player.user.name }}</strong>
          <span>{{ player.points }} pontos</span>
          <span>{{ player.cards.length }} cartas</span>
          @if (player.effect) {
            <span>Efeito: {{ player.effect }}</span>
          }
          @if (player.calledUno) {
            <span>Declarou a última carta</span>
          }
        </li>
      } @empty {
        <li>Ninguém sentou nesta partida.</li>
      }
    </ul>

    <h2>Mãos</h2>
    <ol>
      @for (round of game.rounds; track round.id) {
        <li>Mão {{ round.number }} · {{ round.status }} · {{ round.tricks.length }} vazas</li>
      } @empty {
        <li>Nenhuma mão começou.</li>
      }
    </ol>

    @if (game.winner) {
      <p>Vencedor: {{ game.winner.name }}</p>
    }
  } @else {
    <p>Carregando a partida...</p>
  }
</main>
```

`track player.user.id` usa o id do usuário. Dois lugares não compartilham o mesmo usuário.

As cartas do oponente podem aparecer só pela quantidade. Se você for desenhar a imagem, use `card.url` dentro de um segundo `@for (card of player.cards; track card.id)`. Na partida de exemplo as mãos já vêm preenchidas.

## Id que não existe

`getById('nao-existe')` recebe `404`. O service emite "Falha ao carregar a partida." A tela mostra o alerta e não desenha uma mesa vazia. Mesa vazia seria `players: []` com HTTP 200.

No teste, `expectOne('/api/games/game-1')`. O objeto do `flush` precisa de `id`, `name`, `status` válido, `players` array, `rounds` array e `pointsToWin` igual a `12`, `15` ou `30`. Sem isso, `isGame` recusa a resposta.
